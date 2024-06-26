const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');

const counter = require('../datastore/counter.js');
const todos = require('../datastore/index.js');

const initializeTestFiles = () => {
  counter.counterFile = path.join(__dirname, './counterTest.txt');
  todos.dataDir = path.join(__dirname, 'testData');
  todos.initialize();
};

const initializeTestCounter = (id = '') => {
  fs.writeFileSync(counter.counterFile, id);
};

const cleanTestDatastore = () => {
  fs.readdirSync(todos.dataDir).forEach(
    todo => fs.unlinkSync(path.join(todos.dataDir, todo))
  );
};

describe('getNextUniqueId', () => {
  before(initializeTestFiles);
  beforeEach(initializeTestCounter);
  beforeEach(cleanTestDatastore);

  it('should use error first callback pattern', (done) => {
    counter.getNextUniqueId((err, id) => {
      expect(err).to.be.null;
      expect(id).to.exist;
      done();
    });
  });

  it('should give an id as a zero padded string', (done) => {
    counter.getNextUniqueId((err, id) => {
      expect(id).to.be.a.string;
      expect(id).to.match(/^0/);
      done();
    });
  });

  it('should give the next id based on the count in the file', (done) => {
    fs.writeFileSync(counter.counterFile, '00025');
    counter.getNextUniqueId((err, id) => {
      expect(id).to.equal('00026');
      done();
    });
  });

  it('should update the counter file with the next value', (done) => {
    fs.writeFileSync(counter.counterFile, '00371');
    counter.getNextUniqueId((err, id) => {
      const counterFileContents = fs.readFileSync(counter.counterFile).toString();
      expect(counterFileContents).to.equal('00372');
      done();
    });
  });

});

describe('todos', () => {
  before(initializeTestFiles);
  beforeEach(initializeTestCounter);
  beforeEach(cleanTestDatastore);

  describe('create', () => {
    it('should create a new file for each todo', (done) => {
      todos.createAsync('todo1', (err, data) => {
        const todoCount = fs.readdirSync(todos.dataDir).length;
        expect(todoCount).to.equal(1);
        todos.createAsync('todo2', (err, data) => {
          expect(fs.readdirSync(todos.dataDir)).to.have.lengthOf(2);
          done();
        });
      });
    });

    it('should use the generated unique id as the filename', (done) => {
      fs.writeFileSync(counter.counterFile, '00142');
      todos.createAsync('buy fireworks', (err, todo) => {
        const todoExists = fs.existsSync(path.join(todos.dataDir, '00143.txt'));
        expect(todoExists).to.be.true;
        done();
      });
    });

    it('should only save todo text contents in file', (done) => {
      const todoText = 'walk the dog';
      todos.createAsync(todoText, (err, todo) => {
        const todoFileContents = fs.readFileSync(path.join(todos.dataDir, `${todo.id}.txt`)).toString();
        let parsedContent = JSON.parse(todoFileContents);
        expect(parsedContent.text).to.equal(todoText);
        done();
      });
    });

    it('should pass a todo object to the callback on success', (done) => {
      const todoText = 'refactor callbacks to promises';
      todos.createAsync(todoText, (err, todo) => {
        expect(todo).to.include({ text: todoText });
        expect(todo).to.have.property('id');
        done();
      });
    });
  });

  describe('readAll', () => {
    it('should return an empty array when there are no todos', (done) => {
      todos.readAllAsync((err, todoList) => {
        expect(err).to.be.null;
        expect(todoList.length).to.equal(0);
        done();
      });
    });

    // Refactor this test when completing `readAll`
    it('should return an array with all saved todos', (done) => {
      const todo1text = 'todo 1';
      const todo2text = 'todo 2';
      const time = new Date()
      //const expectedTodoList = [{ id: '00001', text: todo1text, createTime: time, updateTime: createTime}, { id: '00002', text: todo2text,  }];
      todos.createAsync(todo1text, (err, todo) => {
        todos.createAsync(todo2text, (err, todo) => {
          todos.readAllAsync((err, todoList) => {
            expect(todoList).to.have.lengthOf(2);
            //expect(todoList).to.deep.include.members(expectedTodoList, 'NOTE: Text field should use the Id initially');
            done();
          });
        });
      });
    });

  });

  describe('readOne', () => {
    it('should return an error for non-existant todo', (done) => {
      todos.readOneAsync('notAnId', (err, todo) => {
        expect(err).to.exist;
        done();
      });
    });

    it('should find a todo by id', (done) => {
      const todoText = 'buy chocolate';
      todos.createAsync(todoText, (err, createdTodo) => {
        const id = createdTodo.id;
        todos.readOneAsync(id, (err, readTodo) => {
          expect(readTodo.text).to.deep.equal(todoText);
          done();
        });
      });
    });
  });

  describe('update', () => {
    beforeEach((done) => {
      todos.createAsync('original todo', done);
    });

    it('should not change the counter', (done) => {
      todos.updateAsync('00001', 'updated todo', (err, todo) => {
        const counterFileContents = fs.readFileSync(counter.counterFile).toString();
        expect(counterFileContents).to.equal('00001');
        done();
      });
    });

    it('should update the todo text for existing todo', (done) => {
      const todoId = '00001';
      const updatedTodoText = 'updated todo';
      todos.updateAsync(todoId, updatedTodoText, (err, todo) => {
        const todoFileContents = fs.readFileSync(path.join(todos.dataDir, `${todoId}.txt`)).toString();
        let parsedContent = JSON.parse(todoFileContents);
        expect(parsedContent.text).to.equal(updatedTodoText);
        done();
      });
    });

    it('should not create a new todo for non-existant id', (done) => {
      const initalTodoCount = fs.readdirSync(todos.dataDir).length;
      todos.updateAsync('00017', 'bad id', (err, todo) => {
        const currentTodoCount = fs.readdirSync(todos.dataDir).length;
        expect(initalTodoCount).to.equal(currentTodoCount);
        done();
      });
    });

    //     .then(todo => {
    //       const currentTodoCount = fs.readdirSync(todo.dataDir).length;
    //       expect(currentTodoCount).to.equal(initalTodoCount);
    //       expect(todo).to.be.undefined;
    //     })
    //     .catch(err => {
    //       expect(err).to.exist;
    //     });
    //   //done();
    // });
  });


  describe('delete', () => {
    beforeEach((done) => {
      todos.createAsync('delete this todo', done);
    });

    it('should not change the counter', (done) => {
      todos.deleteOneAsync('00001', (err) => {
        const counterFileContents = fs.readFileSync(counter.counterFile).toString();
        expect(counterFileContents).to.equal('00001');
        done();
      });
    });

    it('should delete todo file by id', (done) => {
      todos.deleteOneAsync('00001', (err) => {
        const todoExists = fs.existsSync(path.join(todos.dataDir, '00001.txt'));
        expect(todoExists).to.be.false;
        done();
      });
    });

    it('should return an error for non-existant id', (done) => {
      const initalTodoCount = fs.readdirSync(todos.dataDir).length;
      todos.deleteOneAsync('07829', (err) => {
        const currentTodoCount = fs.readdirSync(todos.dataDir).length;
        expect(currentTodoCount).to.equal(initalTodoCount);
        expect(err).to.exist;
        done();
      });
    });
  });

});