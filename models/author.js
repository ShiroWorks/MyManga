const mongoose = require('mongoose');
const Manga = require('./manga');

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

authorSchema.pre('remove', function(next) {
  Manga.find({ author: this.id }, (err, mangas) => {
    if (err) {
      next(err);
    } else if (mangas.length > 0) {
      next(new Error('This author has mangas still'));
    } else {
      next();
    }
  });
});

module.exports = mongoose.model('Author', authorSchema);
