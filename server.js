//jshint esversion:6
const mongoose = require('mongoose');
//const url = "mongodb+srv://<username>:<password>@cluster0-xkg9x.gcp.mongodb.net/todo_list";
//const url="mongodb://127.0.0.1:27017/todo_list"
const _ = require('lodash');
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const item_schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Put something to do!"]
  }
});

const list_schema = new mongoose.Schema({
  name: String,
  items: [item_schema]
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


//=======================================================================
//insert item_schema to collection items
//plural of schema
const Item = mongoose.model('item', item_schema);
const List = mongoose.model('list', list_schema);

const item1 = new Item({
  name: "Welcome to To Do List!"
});

const item2 = new Item({
  name: "Click + to add new Item"
});

const item3 = new Item({
  name: "Tick the checkbox top delete"
});

const default_items = [item1, item2, item3];
//======================================================================


app.get("/", function(req, res) {

  const day = date.getDate();
  Item.find({}, function(err, found_items) {
    if (found_items.length === 0) {
      Item.insertMany(default_items, function(err) {
        if (err) {
          console.log(err);
          console.log("Databse Empty!");
          console.log(default_items);
        } else {
          console.log("Successfully inserted first");
        }
      });
    } else {
      console.log('Found Items: ', day, found_items);
      res.render('list', {
        listTitle: 'Today',
        listDate: day,
        newListItems: found_items
      });
    }
  });
});


app.post("/", function(req, res) {
  const item_name = req.body.newItem;
  const list_name = _.lowerCase(req.body.list);

  console.log("==============================");
  console.log(item_name, list_name);

  const item = new Item({
    name: item_name
  });

  if (list_name === "today") {
    console.log("inserting Today");
    item.save();
    res.redirect('/');
  } else {
    List.findOne({
      name: list_name
    }, function(err, found_list) {
      console.log("List FOUND!: ", found_list);
      found_list.items.push(item);
      found_list.save();
      res.redirect("/" + list_name);
    });
  }
});


app.post("/delete", function(req, res) {
  const checked_item_id = req.body.checkbox;
  const list_name = _.lowerCase(req.body.list_name);
  console.log("Deleting:", list_name, checked_item_id);

  if (list_name === "today") {

    const result = Item.deleteOne({
      _id: checked_item_id
    }, function(err) {
      if (err) console.log(err);
      console.log(`Successfully deleted ${checked_item_id}!`);
    });
    res.redirect('/');

  } else {
    console.log("deleting from " + list_name + " id:" + checked_item_id);

    List.findOne({
      name: list_name
    }, function(err, found_list) {
      console.log(found_list);
      found_list.items.pull(checked_item_id);
      found_list.save();

      res.redirect("/" + list_name);
    });

  }

});


app.get("/:custom_list_names", function(req, res) {
  const custom_list_name = _.kebabCase(req.params.custom_list_names);
  const day = date.getDate();

  List.findOne({
    name: custom_list_name
  }, function(err, found_list) {
    if (err) console.log(err);
    else {
      if (!found_list) {
        const list = new List({
          name: custom_list_name,
          items: default_items
        });
        list.save();
        res.redirect("/" + custom_list_name);
      } else {
        console.log(`${_.capitalize(custom_list_name)}, ${day}`);
        console.log(found_list);
        res.render('list', {
          listTitle: _.capitalize(custom_list_name),
          listDate: day,
          newListItems: found_list.items
        });
      }
    }
  });
});


app.get("/about", function(req, res) {
  res.render("about");
});

const server = app.listen(process.env.PORT || 3100, () => {
  const port = server.address().port;
  console.log(`Successfully started server @ ${port}`);
});
