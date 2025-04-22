# app.py
from flask import Flask, request, jsonify, render_template
import subprocess
import json
import nmap
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan/subfinder', methods=['POST'])
def run_subfinder():
    try:
        data = request.get_json()
        target = data.get('target')
        
        if not target:
            return jsonify({'error': 'No target provided'}), 400
            
        # Run subfinder command
        process = subprocess.Popen(
            ['subfinder', '-d', target],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        # Process the output
        if stdout:
            subdomains = stdout.decode().strip().split('\n')
            return jsonify({
                'status': 'success',
                'tool': 'subfinder',
                'results': subdomains
            })
        else:
            return jsonify({
                'status': 'error',
                'tool': 'subfinder',
                'error': stderr.decode()
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'tool': 'subfinder',
            'error': str(e)
        }), 500

@app.route('/scan/nmap', methods=['POST'])
def run_nmap():
    try:
        data = request.get_json()
        target = data.get('target')
        
        if not target:
            return jsonify({'error': 'No target provided'}), 400
            
        # Initialize nmap scanner
        nm = nmap.PortScanner()
        
        # Run nmap scan
        nm.scan(target, arguments='-F -sV')  # Fast scan with service version detection
        
        results = []
        
        # Process results
        for host in nm.all_hosts():
            host_data = {
                'host': host,
                'status': nm[host].state(),
                'ports': []
            }
            
            for proto in nm[host].all_protocols():
                ports = nm[host][proto].keys()
                for port in ports:
                    port_info = nm[host][proto][port]
                    host_data['ports'].append({
                        'port': port,
                        'state': port_info['state'],
                        'service': port_info['name'],
                        'version': port_info.get('version', '')
                    })
                    
            results.append(host_data)
            
        return jsonify({
            'status': 'success',
            'tool': 'nmap',
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'tool': 'nmap',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)