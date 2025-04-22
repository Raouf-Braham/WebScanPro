from flask import Flask, request, jsonify, render_template
from urllib.parse import urlparse
import subprocess
import json
import nmap
from flask_cors import CORS
import logging
from threading import Event
import time

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Define callback at module level to fix multiprocessing issues
scan_results = []
def nmap_callback(host, scan_result):
    logger.debug(f"Received results for {host}")
    if scan_result.get('scan', {}):
        host_data = scan_result['scan'][host]
        ports_data = []

        # Get TCP ports if available
        if 'tcp' in host_data:
            for port, port_data in host_data['tcp'].items():
                ports_data.append({
                    'port': port,
                    'state': port_data.get('state', 'unknown'),
                    'service': port_data.get('name', 'unknown'),
                    'version': port_data.get('version', '')
                })

        result = {
            'host': host,
            'status': host_data.get('status', {}).get('state', 'unknown'),
            'ports': ports_data
        }
        scan_results.append(result)

def perform_basic_scan(hostname):
    """Perform a basic nmap scan when async scan fails"""
    try:
        basic_scanner = nmap.PortScanner()
        basic_scan = basic_scanner.scan(
            hostname,
            arguments='-sT -sV -p 1-65535 --version-intensity 5 --max-retries 3 --min-rate 1000'
        )
        
        if basic_scan.get('scan', {}):
            host_data = basic_scan['scan'].get(hostname, {})
            ports_data = []
            
            if 'tcp' in host_data:
                for port, port_data in host_data['tcp'].items():
                    ports_data.append({
                        'port': port,
                        'state': port_data.get('state', 'unknown'),
                        'service': port_data.get('name', 'unknown'),
                        'version': port_data.get('version', '')
                    })
            
            return {
                'host': hostname,
                'status': host_data.get('status', {}).get('state', 'unknown'),
                'ports': ports_data
            }
    except Exception as e:
        logger.error(f"Error in basic scan: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan/subfinder', methods=['POST'])
def run_subfinder():
    try:
        logger.debug("Received subfinder request")
        data = request.get_json()
        target = data.get('target')
        
        logger.debug(f"Target URL: {target}")
        
        if not target:
            logger.error("No target provided")
            return jsonify({'error': 'No target provided'}), 400
            
        # Check if subfinder is installed
        try:
            subprocess.run(['subfinder', '-version'], capture_output=True, check=True)
        except subprocess.CalledProcessError:
            logger.error("subfinder not found or not installed")
            return jsonify({
                'status': 'error',
                'tool': 'subfinder',
                'error': 'subfinder not installed or not in PATH'
            }), 500
            
        # Run subfinder command
        logger.debug("Running subfinder command")
        process = subprocess.Popen(
            ['subfinder', '-d', target],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        # Process the output
        if stdout:
            subdomains = stdout.decode().strip().split('\n')
            logger.debug(f"Found {len(subdomains)} subdomains")
            return jsonify({
                'status': 'success',
                'tool': 'subfinder',
                'results': subdomains
            })
        else:
            logger.error(f"Subfinder error: {stderr.decode()}")
            return jsonify({
                'status': 'error',
                'tool': 'subfinder',
                'error': stderr.decode()
            })
            
    except Exception as e:
        logger.exception("Error in subfinder scan")
        return jsonify({
            'status': 'error',
            'tool': 'subfinder',
            'error': str(e)
        }), 500

@app.route('/scan/nmap', methods=['POST'])
def run_nmap():
    try:
        logger.debug("Received nmap request")
        data = request.get_json()
        target = data.get('target')
        
        if not target:
            logger.error("No target provided")
            return jsonify({'error': 'No target provided'}), 400

        # Input validation
        if not isinstance(target, str):
            return jsonify({'error': 'Target must be a string'}), 400

        # Parse the URL to get the hostname
        try:
            parsed_url = urlparse(target)
            hostname = parsed_url.netloc if parsed_url.netloc else parsed_url.path
            hostname = hostname.split(':')[0]  # Remove port if present
            
            if not hostname:
                return jsonify({'error': 'Invalid target URL'}), 400
                
            logger.debug(f"Scanning hostname: {hostname}")
        except Exception as e:
            logger.error(f"Error parsing URL: {str(e)}")
            return jsonify({'error': 'Invalid target URL format'}), 400

        # Clear previous scan results
        global scan_results
        scan_results = []

        try:
            # First try with basic scan
            basic_result = perform_basic_scan(hostname)
            if basic_result:
                return jsonify({
                    'status': 'success',
                    'tool': 'nmap',
                    'results': [basic_result]
                })

            # If basic scan failed, try async scan
            scanner = nmap.PortScannerAsync()
            
            # Start the scan with improved arguments
            scanner.scan(
                hostname,
                arguments='-sT -F -sV --version-intensity 5 --max-retries 2 --min-rate 1000',
                callback=nmap_callback
            )
            
            # Wait for scan to complete with timeout
            timeout = 60  # 60 seconds timeout
            elapsed = 0
            while scanner.still_scanning() and elapsed < timeout:
                time.sleep(2)
                elapsed += 2

            if elapsed >= timeout:
                return jsonify({
                    'status': 'error',
                    'tool': 'nmap',
                    'error': 'Scan timeout exceeded'
                }), 408

            if not scan_results:
                logger.warning("No results from async scan, performing basic scan")
                basic_result = perform_basic_scan(hostname)
                if basic_result:
                    scan_results = [basic_result]

            logger.debug(f"Scan completed, found {len(scan_results)} results")
            return jsonify({
                'status': 'success',
                'tool': 'nmap',
                'results': scan_results
            })

        except nmap.PortScannerError as e:
            logger.error(f"Scan error: {str(e)}")
            return jsonify({
                'status': 'error',
                'tool': 'nmap',
                'error': f'Scan error: {str(e)}'
            }), 500

    except Exception as e:
        logger.exception("Error in nmap scan")
        return jsonify({
            'status': 'error',
            'tool': 'nmap',
            'error': str(e)
        }), 500

@app.route('/scan/ffuf', methods=['POST'])
def run_ffuf():
    try:
        logger.debug("Received ffuf request")
        data = request.get_json()
        target = data.get('target')
        wordlist = data.get('wordlist', './static/common.txt')
        extensions = data.get('extensions', 'php,html,txt')
        
        if not target:
            logger.error("No target provided")
            return jsonify({'error': 'No target provided'}), 400

        # Input validation
        if not isinstance(target, str):
            return jsonify({'error': 'Target must be a string'}), 400

        try:
            parsed_url = urlparse(target)
            if not parsed_url.scheme:
                target = f"http://{target}"
            
            logger.debug(f"Fuzzing target: {target}")
        except Exception as e:
            logger.error(f"Error parsing URL: {str(e)}")
            return jsonify({'error': 'Invalid target URL format'}), 400

        # Check if ffuf is installed
        try:
            subprocess.run(['ffuf', '-V'], capture_output=True, check=True)
        except subprocess.CalledProcessError:
            logger.error("ffuf not found or not installed")
            return jsonify({
                'status': 'error',
                'tool': 'ffuf',
                'error': 'ffuf not installed or not in PATH'
            }), 500

        # Create a temporary directory for output
        import tempfile
        import os
        
        with tempfile.TemporaryDirectory() as temp_dir:
            output_file = os.path.join(temp_dir, 'ffuf_output.json')
            
            # Prepare ffuf command
            ffuf_command = [
                'ffuf',
                '-u', f'{target}/FUZZ',
                '-w', wordlist,
                '-e', extensions,
                '-mc', '200,201,202,203,204,301,302,307,401,403',
                '-o', output_file,
                '-of', 'json'
                # Removed -s flag to see potential errors
            ]

            # Run ffuf command
            logger.debug(f"Running ffuf command: {' '.join(ffuf_command)}")
            try:
                process = subprocess.Popen(
                    ffuf_command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                stdout, stderr = process.communicate(timeout=300)

                # Check if the process was successful
                if process.returncode != 0:
                    logger.error(f"Ffuf command failed: {stderr.decode()}")
                    return jsonify({
                        'status': 'error',
                        'tool': 'ffuf',
                        'error': f'Ffuf command failed: {stderr.decode()}'
                    }), 500

                # Check if output file exists
                if not os.path.exists(output_file):
                    logger.error("Ffuf output file was not created")
                    return jsonify({
                        'status': 'error',
                        'tool': 'ffuf',
                        'error': 'No output file was created'
                    }), 500

                # Read and parse the JSON output file
                try:
                    with open(output_file, 'r') as f:
                        ffuf_results = json.load(f)
                    
                    # Process and format the results
                    formatted_results = []
                    for result in ffuf_results.get('results', []):
                        formatted_results.append({
                            'url': result.get('url', ''),
                            'status': result.get('status', 0),
                            'content_length': result.get('length', 0),
                            'content_words': result.get('words', 0),
                            'content_lines': result.get('lines', 0),
                            'content_type': result.get('content-type', '')
                        })

                    return jsonify({
                        'status': 'success',
                        'tool': 'ffuf',
                        'results': formatted_results
                    })

                except Exception as e:
                    logger.error(f"Error processing ffuf results: {str(e)}")
                    return jsonify({
                        'status': 'error',
                        'tool': 'ffuf',
                        'error': f'Error processing results: {str(e)}'
                    }), 500

            except subprocess.TimeoutExpired:
                process.kill()
                logger.error("Ffuf scan timed out")
                return jsonify({
                    'status': 'error',
                    'tool': 'ffuf',
                    'error': 'Scan timeout exceeded (5 minutes)'
                }), 408

    except Exception as e:
        logger.exception("Error in ffuf scan")
        return jsonify({
            'status': 'error',
            'tool': 'ffuf',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)