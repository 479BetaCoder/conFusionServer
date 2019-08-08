const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Dishes = require('../model/dishes');
const Favorites = require('../model/favorite');
const cors = require('./cors');

var authenticate = require('../authenticate');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({ user: req.user._id })
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorite) => {
                if (favorite != null) {
                    req.body.forEach((dish) => {
                        Dishes.findById(dish._id).then((dish) => {
                            if (favorite.dishes.indexOf(dish._id) == -1 && dish != null) {
                                favorite.dishes.push(dish._id);
                            }
                        });

                    });
                    favorite.save()
                        .then((favorite) => {
                            Favorites.findById(favorite._id)
                                .then((favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                })
                        }, (err) => next(err));
                }
                else {
                    Favorites.create({ user: req.user._id })
                        .then(favorite => {
                            req.body.forEach((dish) => {
                                if (favorite.dishes.indexOf(dish_id) == -1)
                                    favorite.dishes.push(dish._id);
                            });
                            favorite.save()
                                .then((favorite) => {

                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);

                                }, (err) => next(err));

                        }, err => next(err))
                        .catch(err => next(err));
                }
            }, (err) => next(err)).catch((err) => next(err));

    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOneAndRemove({ user: req.user._id })
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, err => next(err))
            .catch(err => next(err));

    });
favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .then((dish) => {
                if (dish != null) {
                    Favorites.findOne({ user: req.user._id })
                        .then((favorite) => {
                            if (favorite != null) {
                                if (favorite.dishes.indexOf(dish._id) == -1) {
                                    favorite.dishes.push(dish._id);
                                    favorite.save()
                                        .then((favorite) => {
                                            Favorites.findById(favorite._id)
                                                .then((favorite) => {
                                                    res.statusCode = 200;
                                                    res.setHeader('Content-Type', 'application/json');
                                                    res.json(favorite);
                                                })
                                        }, (err) => next(err));
                                } else {
                                    err = new Error('Dish ' + req.params.dishId + ' already added to favorites');
                                    err.status = 403;
                                    return next(err);
                                }
                            }
                            else {
                                Favorites.create({ user: req.user._id })
                                    .then(favorite => {
                                        favorite.dishes.push(dish._id);
                                        favorite.save()
                                            .then((favorite) => {
                                                Favorites.findById(favorite._id)
                                                    .then((favorite) => {
                                                        res.statusCode = 200;
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.json(favorite);
                                                    })
                                            }, (err) => next(err));

                                    }, err => next(err))
                                    .catch(err => next(err));
                            }
                        }, (err) => next(err)).catch((err) => next(err));
                } else {
                    err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorite) => {
                if (favorite.dishes.indexOf(req.params.dishId) != -1) {
                    favorite.dishes.splice(favorite.dishes.indexOf(req.params.dishId), 1);
                    favorite.save();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                } else {
                    err = new Error('Dish ' + req.params.dishId + ' not found in favorites');
                    err.status = 404;
                    return next(err);
                }
            }, err => next(err))
            .catch(err => next(err));
    });

module.exports = favoriteRouter;