from PyPDF2 import PdfReader, PdfWriter

tempFile = PdfWriter()
file = input("Original file WITHOUT PAGE NUMBERS (program adds .pdf)\n> ")
# Put file without in correct order here
reader = PdfReader(f"{file}.pdf")


for i in range(len(reader.pages)):
    tempFile.add_page(reader.pages[i])

pages = 0

while len(tempFile.pages) % 16 != 0:
    tempFile.add_blank_page(210, 297)
    pages += 1

print(f"Added {pages} blank pages")

with open("pdf_with_blank_pages.pdf", "wb") as fp:
    tempFile.write(fp)

print("Add page numbers and then take to main for reordering")
