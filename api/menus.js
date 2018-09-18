const express = require('express');
const menusRouter = express();
module.exports = menusRouter;

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menusRouter.param('menuId',(req,res,next,menuId)=>{
  const sql = 'SELECT * FROM Menu where Menu.id = $menuId';
  const values = {$menuId:menuId};
  db.get(sql,values,(err,menu)=>{
    if(err){
      next(err);
    }
    else if (menu){
        req.menu = menu;
        next();
      }
      else {
        res.sendStatus(404);
      }
    })
})

//import menu-items router and link to endpoint for menuId. mergeParams set in menu-items.js
const menuitemsRouter = require('./menu-items.js');
menusRouter.use('/:menuId/menu-items', menuitemsRouter);

//Router to retrieve all menus
menusRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Menu';
  db.all(sql,(err, menus) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({menus: menus});
      }
    });
});

//Router to retrieve single Menu by ID, with use of router.param req.menu object.
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

//Create new Menu with use of Body-parser on object body.menu.
menusRouter.post('/', (req, res, next) => {

  if (!req.body.menu.title) {
    return res.sendStatus(400);
  }

  const values = {$title: req.body.menu.title};

  const sql = 'INSERT INTO Menu (Title) VALUES ($title)';
  db.run(sql, values, function(err){
      if (err) {
        next(err);
      } else {
        //get newly created Menu to return
        db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
          (error, menu) => {
            res.status(201).json({menu: menu});
          });
      }
    });
});

// update Menu with use of Body-parser, router param req.params object
menusRouter.put('/:menuId', (req, res, next) => {
  if (!req.body.menu.title) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Menu SET title = $title WHERE Menu.id = $menuId';
  const values = {
    $title: req.body.menu.title,
    $menuId: req.params.menuId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
});

// Delete Menu but check to see that there are no Menu-items
menusRouter.delete('/:menuId', (req, res, next) => {
  const checkMenuItems = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const checkMenuValues = {$menuId:req.params.menuId};
  db.get(checkMenuItems,checkMenuValues,(error,menuitems)=>{
    if(error) {
      next(error);
    }
    else {
      if(menuitems){
        return res.sendStatus(400);
      }
      else {
        //oke, we are fine. no menu-items. So delete the menu
        const sql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
        const values = {$menuId: req.params.menuId};

        db.run(sql, values, (error) => {
          if (error) {
            res.sendStatus(404);
            next(error);
          } else {
          res.sendStatus(204);
          }
        });
      }
    }
  })
});
