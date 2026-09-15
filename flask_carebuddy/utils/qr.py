import os
import qrcode
from config import Config

def generate_qr_code_image(target_url, token_str):
    """
    Generates a high-contrast QR code image saved in static/uploads/qr/
    Returns the generated filename.
    """
    if not os.path.exists(Config.QR_UPLOAD_FOLDER):
        os.makedirs(Config.QR_UPLOAD_FOLDER, exist_ok=True)
        
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(target_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#0f172a", back_color="white")
    filename = f"qr_{token_str}.png"
    filepath = os.path.join(Config.QR_UPLOAD_FOLDER, filename)
    img.save(filepath)
    return filename
