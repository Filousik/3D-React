import express from "express"
import multer from "multer"
import path from "path"

const router = express.Router()

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb)=>{
        const uniqueName = Date.now() + "-" + file.originalname
        cb(null, uniqueName)
    }
})

function fileFilter(req, file, cb) {
    const allowedTypes = [
        ".png",
        ".jpg",
        ".jpeg"
    ]
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedTypes.includes(ext)){
        cb(null, true)
    }else {
        cb(new Error("File type not allowed"), false);
        
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50* 1024* 1024 // 50MB
    }

})

router.post("/", upload.single("file"), (req,res)=>{
    const file = req.file

    res.json({
        message: "Uploaded file",
        filename: file.filename,
        path: "/uploads/" + file.filename
    })
})



export default router