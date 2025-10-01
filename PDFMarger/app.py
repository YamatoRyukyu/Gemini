import tkinter as tk
from tkinter import filedialog, messagebox, Listbox, Scrollbar
import os
import re
import fitz  # PyMuPDF

class PDFMergerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("PDF・PNG 結合アプリ")
        self.root.geometry("500x600")

        self.file_list = []

        # --- Widgets ---
        # Frame for buttons
        button_frame = tk.Frame(root)
        button_frame.pack(pady=10)

        self.select_folder_button = tk.Button(button_frame, text="フォルダを選択", command=self.select_folder)
        self.select_folder_button.pack(side=tk.LEFT, padx=5)

        self.select_files_button = tk.Button(button_frame, text="ファイルを選択", command=self.select_files)
        self.select_files_button.pack(side=tk.LEFT, padx=5)

        # Frame for listbox and scrollbar
        list_frame = tk.Frame(root)
        list_frame.pack(pady=10, padx=10, fill=tk.BOTH, expand=True)
        
        self.listbox_label = tk.Label(list_frame, text="結合するファイル（ファイル名順）:")
        self.listbox_label.pack(anchor=tk.W)

        self.listbox = Listbox(list_frame)
        self.listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.scrollbar = Scrollbar(list_frame, orient=tk.VERTICAL, command=self.listbox.yview)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.listbox.config(yscrollcommand=self.scrollbar.set)

        # Merge button
        self.merge_button = tk.Button(root, text="結合してPDFとして保存", command=self.merge_and_save, height=2)
        self.merge_button.pack(pady=20, padx=10, fill=tk.X)

    def select_folder(self):
        folder_path = filedialog.askdirectory()
        if not folder_path:
            return
        
        self.file_list = []
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.pdf']
        for filename in os.listdir(folder_path):
            if any(filename.lower().endswith(ext) for ext in allowed_extensions):
                self.file_list.append(os.path.join(folder_path, filename))
        
        self.update_listbox()

    def select_files(self):
        files = filedialog.askopenfilenames(
            filetypes=[("Image/PDF Files", "*.png *.jpg *.jpeg *.pdf"), ("All files", "*.*")]
        )
        if not files:
            return
            
        self.file_list = list(files)
        self.update_listbox()

    @staticmethod
    def natural_sort_key(s):
        return [int(text) if text.isdigit() else text.lower()
                for text in re.split(r'([0-9]+)', os.path.basename(s))]

    def update_listbox(self):
        self.listbox.delete(0, tk.END)
        self.file_list.sort(key=self.natural_sort_key)
        for file_path in self.file_list:
            self.listbox.insert(tk.END, os.path.basename(file_path))

    def merge_and_save(self):
        if not self.file_list:
            messagebox.showwarning("警告", "ファイルが選択されていません。")
            return

        save_path = filedialog.asksaveasfilename(
            defaultextension=".pdf",
            filetypes=[("PDF Files", "*.pdf")]
        )
        if not save_path:
            return

        try:
            result_pdf = fitz.open() # 新しい空のPDFを作成

            for file_path in self.file_list:
                if file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
                    img_doc = fitz.open(file_path)
                    pdf_bytes = img_doc.convert_to_pdf()
                    img_pdf = fitz.open("pdf", pdf_bytes)
                    result_pdf.insert_pdf(img_pdf)
                    img_doc.close()
                    img_pdf.close()
                elif file_path.lower().endswith('.pdf'):
                    pdf_doc = fitz.open(file_path)
                    result_pdf.insert_pdf(pdf_doc)
                    pdf_doc.close()
            
            result_pdf.save(save_path)
            result_pdf.close()
            messagebox.showinfo("成功", f"PDFが正常に保存されました:\n{save_path}")

        except Exception as e:
            messagebox.showerror("エラー", f"PDFの作成中にエラーが発生しました:\n{e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = PDFMergerApp(root)
    root.mainloop()
