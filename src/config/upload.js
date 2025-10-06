import multer from "multer";
import path from "path";

const destinationFolder = path.join(__dirname, "..", "public", "uploads");

const storage = multer.diskStorage({
  destination: (_, _, cb) => {
    cb(null, destinationFolder);
  },
  filename: (_, file, cb) => {
    const fileExtName = Date.now() + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${fileExtName}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb("Only images and pdf's accepted.", false);
    }
  },
  limits: {
    fileSize: 1014 * 1024 * 10, //10mb max file size
    files: 3,
  },
});

export default upload;
