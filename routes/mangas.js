const express = require('express');
const router = express.Router();
const Manga = require('../models/manga');
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif'];

// All Mangas Route
router.get('/', async (req, res) => {
  let query = Manga.find();
  if (req.query.title != null && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'));
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
    query = query.lte('publishDate', req.query.publishedBefore);
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
    query = query.gte('publishDate', req.query.publishedAfter);
  }
  try {
    const mangas = await query.exec();
    res.render('mangas/index', {
      mangas: mangas,
      searchOptions: req.query
    });
  } catch {
    res.redirect('/');
  }
});

// New Manga Route
router.get('/new', async (req, res) => {
  renderNewPage(res, new Manga());
});

// Create Manga Route
router.post('/', async (req, res) => {
  const manga = new Manga({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    description: req.body.description
  });
  saveCover(manga, req.body.cover);

  try {
    const newBook = await manga.save();
    res.redirect(`mangas/${newBook.id}`);
  } catch {
    renderNewPage(res, manga, true);
  }
});

// Show Manga Route
router.get('/:id', async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id)
      .populate('author')
      .exec();
    res.render('mangas/show', { manga: manga });
  } catch {
    res.redirect('/');
  }
});

// Edit Manga Route
router.get('/:id/edit', async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    renderEditPage(res, manga);
  } catch {
    res.redirect('/');
  }
});

// Update Manga Route
router.put('/:id', async (req, res) => {
  let manga;

  try {
    manga = await Manga.findById(req.params.id);
    manga.title = req.body.title;
    manga.author = req.body.author;
    manga.publishDate = new Date(req.body.publishDate);
    manga.pageCount = req.body.pageCount;
    manga.description = req.body.description;
    if (req.body.cover != null && req.body.cover !== '') {
      saveCover(manga, req.body.cover);
    }
    await manga.save();
    res.redirect(`/mangas/${manga.id}`);
  } catch {
    if (manga != null) {
      renderEditPage(res, manga, true);
    } else {
      redirect('/');
    }
  }
});

// Delete Manga Page
router.delete('/:id', async (req, res) => {
  let manga;
  try {
    manga = await Manga.findById(req.params.id);
    await manga.remove();
    res.redirect('/mangas');
  } catch {
    if (manga != null) {
      res.render('mangas/show', {
        manga: manga,
        errorMessage: 'Could not remove manga'
      });
    } else {
      res.redirect('/');
    }
  }
});

async function renderNewPage(res, manga, hasError = false) {
  renderFormPage(res, manga, 'new', hasError);
}

async function renderEditPage(res, manga, hasError = false) {
  renderFormPage(res, manga, 'edit', hasError);
}

async function renderFormPage(res, manga, form, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      manga: manga
    };
    if (hasError) {
      if (form === 'edit') {
        params.errorMessage = 'Error Updating Manga';
      } else {
        params.errorMessage = 'Error Creating Manga';
      }
    }
    res.render(`mangas/${form}`, params);
  } catch {
    res.redirect('/mangas');
  }
}

function saveCover(manga, coverEncoded) {
  if (coverEncoded == null) return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    manga.coverImage = new Buffer.from(cover.data, 'base64');
    manga.coverImageType = cover.type;
  }
}

module.exports = router;
