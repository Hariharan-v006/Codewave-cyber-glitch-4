1. What Are 2D Barcodes?

A 2D barcode stores information both horizontally and vertically, allowing it to hold much more data than a traditional 1D barcode (UPC/EAN).

Common 2D barcodes used in products:

QR Code

Data Matrix

PDF417

These barcodes can store:

Product ID

Batch number

Manufacturing date

Expiry date

Serial number

Example encoded data:

GTIN: 8901234567890
EXP: 2026-12-31
LOT: A2356
2. How Expiry Date Is Encoded

Many industries follow the GS1 standard.

The organization that defines this format is:

GS1

GS1 uses Application Identifiers (AI).

Example:

AI Code	Meaning
01	Product GTIN
10	Batch / Lot
17	Expiry Date
11	Manufacturing Date

Example encoded string:

(01)08901234567890(17)261231(10)A2356

Meaning:

Code	Value
01	GTIN
17	Expiry date (YYMMDD)
10	Lot number

Expiry date here:

261231 → 31 Dec 2026
3. How the Barcode Scanning Process Works
Step 1 — Capture Image

The camera captures an image of the barcode.

Example libraries:

OpenCV

ZBar

ZXing

Step 2 — Detect Barcode Region

The system identifies the barcode area inside the image.

Typical process:

Convert image to grayscale

Apply thresholding

Detect square patterns

Extract barcode region

Example OpenCV workflow:

Image → Grayscale → Edge Detection → Barcode Detection
Step 3 — Decode Barcode

The barcode library decodes the symbol.

Example output:

01089012345678901726123110A2356

This is the raw encoded string.

4. Extracting Expiry Date from the Code

You now parse the Application Identifier (AI).

Look for:

17 → Expiry Date

Example:

01089012345678901726123110A2356

Breakdown:

Segment	Meaning
01	GTIN
08901234567890	Product ID
17	Expiry AI
261231	Expiry date

Convert:

YYMMDD → 2026-12-31
5. Implementation in Python

Example decoding pipeline:

Step 1 – Scan Barcode

Using OpenCV + pyzbar.

from pyzbar.pyzbar import decode
import cv2

image = cv2.imread("barcode.png")
barcodes = decode(image)

for barcode in barcodes:
    data = barcode.data.decode("utf-8")
    print(data)

Output:

01089012345678901726123110A2356
Step 2 – Extract Expiry Date
import re

data = "01089012345678901726123110A2356"

match = re.search(r"17(\d{6})", data)

if match:
    expiry = match.group(1)
    year = "20" + expiry[0:2]
    month = expiry[2:4]
    day = expiry[4:6]

    print(f"Expiry Date: {year}-{month}-{day}")

Output:

Expiry Date: 2026-12-31
6. Types of Expiry Encoding

Not all barcodes use GS1 format.

Sometimes expiry is encoded as:

Format 1 — Plain Text
EXP:2025-09-15
Format 2 — Compact
EXP250915
Format 3 — Custom JSON
{
 "product":"123456",
 "expiry":"2025-09-15"
}

Your parser should handle multiple formats.

7. Integration in SafeScan

Workflow for your application:

Camera Scan
     ↓
Detect Barcode
     ↓
Decode Barcode Data
     ↓
Check if 2D barcode
     ↓
Parse GS1 AI
     ↓
Extract Expiry Date
     ↓
Show Warning if expired

Example UI result:

Product: Coca Cola
Expiry Date: 2025-09-15
Status: ⚠ Near Expiry
8. Advantages of Using 2D Barcodes

Compared to normal barcodes:

Feature	1D Barcode	2D Barcode
Data capacity	Low	Very high
Expiry storage	❌	✅
Batch number	❌	✅
Serial tracking	❌	✅

This is why pharmaceutical companies use DataMatrix codes.

9. Challenges in Expiry Detection
1. Poor Camera Focus

Blurred barcode → decode failure.

Solution:

Auto focus

Image sharpening.

2. Partial Barcode Damage

Torn packaging.

Solution:

Error correction in QR codes.

3. Different Encoding Standards

Not all companies use GS1.

Solution:

Multi-format parsing.

10. Recommended Libraries

For your project:

Task	Tool
Barcode scanning	ZXing
Python decoding	pyzbar
Image processing	OpenCV
11. Advanced Feature (Very Impressive for Demo)

You can also detect expiry visually using OCR if barcode does not contain it.

Use:

Tesseract OCR

Example:

EXP: 12/2025

Detected directly from packaging.

12. Final SafeScan Expiry Detection Architecture
Camera
   ↓
Barcode Scanner
   ↓
Decode Data
   ↓
Check GS1 AI
   ↓
Extract Expiry Date
   ↓
If Not Found → OCR Packaging
   ↓
Display Expiry Warning