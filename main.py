from PyPDF2 import PdfReader, PdfWriter

file = input("Name of the file with BLANK PAGES and PAGE NUMBERS (program adds .pdf)\n> ")

# Make this the pdf with blank pages and PAGE NUMBERS (use another program)
reader = PdfReader(f"{file}.pdf")
writer = PdfWriter()

SIXTEEN = [15, 0, 13, 2, 1, 14, 3, 12, 11, 4, 9, 6, 5, 10, 7, 8]
reorder = []
meta = reader.metadata

number_of_leaflets = int(input("How many leaflets?\n> "))

if number_of_leaflets == 16:
    reorder = SIXTEEN
else:
    print("You'll have to edit the code")
length_of_pdf = int(len(reader.pages)/16)

add = 0

for i in range(length_of_pdf):
    print("-", end="")
    for p in range(len(reorder)):
        page = reorder[p] + add
        writer.add_page(reader.pages[page])
    add += 16


# print(meta.author)
# print(meta.title)

name = input("\nName of the output file:\n> ")

with open(name, "wb") as fp:
    writer.write(fp)
