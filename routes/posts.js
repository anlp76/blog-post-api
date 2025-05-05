const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middlewares/upload');

router.get('/', postController.getAll);
router.get('/:id', postController.getOne);

router.post('/', upload.single('image'), postController.create);

router.put('/:id', upload.single('image'), postController.update);
router.delete('/:id', postController.remove);

module.exports = router;