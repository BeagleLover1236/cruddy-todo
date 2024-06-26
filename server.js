
// Todo Model //////////////////////////////////////////////////////////////////

const Todo = require('./datastore');

// Configure Express ///////////////////////////////////////////////////////////

const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './public')));

// RESTful Routes for CRUD operations //////////////////////////////////////////

// Create (Crud) -- collection route
app.post('/todo', (req, res) => {
  Todo.createAsync(req.body.todoText, (err, newTodo) => {
    if (err) {
      res.sendStatus(400);
    } else {
      res.status(201).json(newTodo);
    }
  });
});

// Read all (cRud) -- collection route
app.get('/todo', (req, res) => {
  Todo.readAllAsync((err, todos) => {
    if (err) {
      res.sendStatus(400);
    } else {
      res.status(200).json(todos);
    }
  });
});

// Read one (cRud) -- member route
app.get('/todo/:id', (req, res) => {
  Todo.readOneAsync(req.params.id, (err, todo) => {
    if (todo) {
      res.status(200).json(todo);
    } else {
      res.sendStatus(404);
    }
  });
});

// Update (crUd) -- member route
app.put('/todo/:id', (req, res) => {
  Todo.updateAsync(req.params.id, req.body.todoText, (err, todo) => {
    if (todo) {
      res.status(200).json(todo);
    } else {
      res.sendStatus(404);
    }
  });
});

// Delete (cruD) -- member route
app.delete('/todo/:id', (req, res) => {
  Todo.deleteOneAsync(req.params.id, (err) => {
    if (err) {
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
    }
  });
});

// Start & Initialize Web Server ///////////////////////////////////////////////

const port = 3000;
app.listen(port, () => {
  console.log('CRUDdy Todo server is running in the terminal');
  console.log(`To get started, visit: http://localhost:${port}`);
});

Todo.initialize();
