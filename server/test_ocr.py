import requests
import time
from io import BytesIO
from PIL import Image

# Create a dummy image
img = Image.new('RGB', (100, 30), color = (73, 109, 137))
img_byte_arr = BytesIO()
img.save(img_byte_arr, format='JPEG')
img_bytes = img_byte_arr.getvalue()

try:
    response = requests.post(
        'http://localhost:8080/api/v1/parse',
        files={'file': ('dummy.jpg', img_bytes, 'image/jpeg')}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
