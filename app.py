import os
import re
import json
import xml.etree.ElementTree as ET
import urllib.request
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

CACHE_FILE = 'cache.json'
FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

def parse_feed_content(xml_data):
    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        print(f"Error parsing XML data: {e}")
        return []

    ns = {'ns': 'http://www.w3.org/2005/Atom'}
    entries = []
    
    # Iterate entries in chronological order or reverse chronological
    for entry_el in root.findall('ns:entry', ns):
        title_el = entry_el.find('ns:title', ns)
        date_str = title_el.text if title_el is not None else "Unknown Date"
        
        link_el = entry_el.find('ns:link[@rel="alternate"]', ns)
        if link_el is None:
            link_el = entry_el.find('ns:link', ns)
        link_href = link_el.attrib.get('href', '') if link_el is not None else ''
        
        content_el = entry_el.find('ns:content', ns)
        if content_el is None:
            continue
            
        html_content = content_el.text or ""
        
        # Split by h3 tags to extract individual items in this entry
        matches = list(re.finditer(r'<h3>(.*?)</h3>', html_content))
        
        if not matches:
            # Normalize whitespace
            clean_content = html_content.strip()
            entries.append({
                'id': f"{date_str.replace(' ', '_')}_0",
                'date': date_str,
                'category': 'General',
                'content': clean_content,
                'link': link_href
            })
            continue
            
        for idx, match in enumerate(matches):
            category = match.group(1).strip()
            start_pos = match.end()
            end_pos = matches[idx+1].start() if idx + 1 < len(matches) else len(html_content)
            item_content = html_content[start_pos:end_pos].strip()
            
            # Generate a unique ID for this item
            safe_date = re.sub(r'[^a-zA-Z0-9]', '_', date_str)
            item_id = f"{safe_date}_{idx}"
            
            entries.append({
                'id': item_id,
                'date': date_str,
                'category': category,
                'content': item_content,
                'link': link_href
            })
            
    return entries

def fetch_and_cache(force=False):
    # Check if cache file exists and read from it if not force
    if not force and os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading cache: {e}")

    # Fetch from web
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
            
        # Parse
        releases = parse_feed_content(xml_data)
        
        # Save to cache
        if releases:
            with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(releases, f, indent=2, ensure_ascii=False)
            return releases
    except Exception as e:
        print(f"Error fetching feed: {e}")
        
    # Fallback to cache if request fails
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading cache on fallback: {e}")
            
    return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    releases = fetch_and_cache(force=force_refresh)
    if not releases:
        return jsonify({'error': 'Failed to load release notes. Please check connection and try again.'}), 500
    return jsonify(releases)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
