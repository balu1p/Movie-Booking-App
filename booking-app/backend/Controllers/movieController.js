const Movies=require("../Models/Movie");
const jwt=require('jsonwebtoken');
const mongoose=require('mongoose');
const admin = require("../Models/admin");

const addMovies = async (req, res) => {
  const extractToken = req.headers.authorization.split(" ")[1];

  if (!extractToken || extractToken.trim() === "") {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  console.log(extractToken);
  let adminId;
  try {
    const decrypted = await jwt.verify(extractToken, process.env.SECRET_KEY);
    adminId = decrypted.id;
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  const { title, description, releaseDate, posterUrl, featured, actors } =
    req.body;

  if (!title || title.trim() === "" || !description || description.trim() === "" || !posterUrl || posterUrl.trim() === "") {
    return res.status(422).json({
      message: "Invalid inputs",
    });
  }

  let movie;
  try {
    movie = new Movies({
      title,
      description,
      releaseDate: new Date(`${releaseDate}`),
      posterUrl,
      featured,
      admin: adminId,
      actors,
    });

    const session = await mongoose.startSession();
    const adminUser = await admin.findById(adminId);

    session.startTransaction();
    await movie.save({ session });
    adminUser.addedMovies.push(movie);
    await adminUser.save({ session });

    await session.commitTransaction();
  } catch (err) {
    return res.status(500).send(err.message);
  }

  if (!movie) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }

  return res.status(201).json({ movie });
};

const getallMovies = async (req, res) => {
  let movies;
  try {
    movies = await Movies.find();
  } catch (err) {
    return res.status(500).send(err.message);
  }

  if (!movies) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }

  return res.status(200).json({ movies });
};

const getMoviesbyId = async (req, res) => {
  const id = req.params.id;
  let movie;
  try {
    movie = await Movies.findById(id);
  } catch (err) {
    return res.status(500).send(err.message);
  }

  if (!movie) {
    return res.status(404).json({
      message: "Movie not found",
    });
  }

  return res.status(200).json({ movie });
};

module.exports = { addMovies, getallMovies, getMoviesbyId };
