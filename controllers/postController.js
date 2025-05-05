const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { nanoid } = require('nanoid');
const filePath = path.join(__dirname, '../posts.json');
const util = require('util');

const assetsDir = path.join(__dirname, '../assets');

const ensureDirectoryExistence = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

function readPosts() {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } else {
    return [];
  }
}

function writePosts(data) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function slugify(title) {
  return title
    .toString()
    .normalize('NFD')                   // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')    // Remove os caracteres especiais dos acentos
    .toLowerCase()                      // Deixa tudo minúsculo
    .trim()                             // Remove espaços extra
    .replace(/\s+/g, '-')               // Substitui espaços por hífens
    .replace(/[^\w\-]+/g, '')           // Remove todos os caracteres não alfanuméricos exceto hífens
    .replace(/\-\-+/g, '-')             // Remove hífens duplicados
}

function getFullImageUrl(req, imagePath) {
  const protocol = req.protocol;  // http ou https
  const host = req.get('host');   // Ex: localhost:3000 ou api.meusite.com
  return `${protocol}://${host}${imagePath}`;
}

exports.create = async (req, res) => {
  try {
    const posts = readPosts();
    const { title, content } = req.body;
    const slug = slugify(title);
    const postId = nanoid(10);

    let imageUrl = '';

    if (req.file) {
      const filename = `${postId}-${slug}.jpg`;
      const outputPath = path.join(assetsDir, filename);

      await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      imageUrl = getFullImageUrl(req, `/assets/${filename}`);
    }

    const newPost = {
      id: postId,
      title,
      content,
      slug,
      image: imageUrl,
      date: new Date().toISOString(),
    };

    posts.push(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Erro ao criar post:', err);
    res.status(500).json({ error: 'Erro interno ao criar post.' });
  }
};

exports.update = async (req, res) => {
  try {
    const posts = readPosts();
    const index = posts.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Post não encontrado' });

    const post = posts[index];

    const title = req.body?.title ?? post.title;
    const content = req.body?.content ?? post.content;

    let updatedImageUrl = post.image;

    if (req.file) {
      const slug = slugify(title);
      const filename = `${post.id}-${slug}.jpg`;
      const outputPath = path.join(assetsDir, filename);

      await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      updatedImageUrl = getFullImageUrl(req, `/assets/${filename}`);
    }

    posts[index] = {
      ...post,
      title,
      content,
      image: updatedImageUrl,
    };

    writePosts(posts);
    res.json(posts[index]);
  } catch (err) {
    console.error('Erro ao atualizar post:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar post.' });
  }
};

exports.getAll = (req, res) => {
  console.log(`Requisição recebida: ${req}`);
  const posts = readPosts();
  res.json(posts);
};

exports.getOne = (req, res) => {
  console.log(`Requisição recebida: ${req}`);
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (post) res.json(post);
  else res.status(404).json({ error: 'Post não encontrado' });
};

exports.remove = (req, res) => {
  console.log(`Requisição recebida: ${req}`);
  let posts = readPosts();
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Post não encontrado' });

  const removed = posts.splice(index, 1)[0];
  writePosts(posts);
  res.json(removed);
};