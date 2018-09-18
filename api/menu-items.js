const express = require('express');
const menuitemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//create params.router for param menuItemId
menuitemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
  const values = {$menuItemId: menuItemId};
  db.get(sql, values, (error, menuitem) => {
    if (error) {
      next(error);
    } else if (menuitem) {
      req.menuItem = menuitem;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//Retrieve all menu-items for menu-id

menuitemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const values = {$menuId:req.params.menuId};
  db.all(sql,values,(err, menuitems) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({menuItems: menuitems});
      }
    });
});

// Create new menu-item for menuId
menuitemsRouter.post('/', (req, res, next) => {

  const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValues = {$menuId: req.params.menuId};
  db.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      next(error);
    } else {
      if (!req.body.menuItem.name || !req.body.menuItem.description || !req.body.menuItem.inventory || !req.body.menuItem.price) {
        return res.sendStatus(400);
      }

      const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id)' +
          'VALUES ($name, $description, $inventory, $price, $menuId)';
      const values = {
        $name: req.body.menuItem.name,
        $description: req.body.menuItem.description,
        $inventory: req.body.menuItem.inventory,
        $price: req.body.menuItem.price,
        $menuId: req.params.menuId};


      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
            (error, menuitem) => {
              res.status(201).json({menuItem: menuitem});
            });
        }
      });
    }
  });
});

// update the menu-item. We can use req.params.$menuItemId and will use the req.params.menuid again to check if menu exists.
menuitemsRouter.put('/:menuItemId', (req, res, next) => {

// first check if Menu exists
  const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValues = {$menuId: req.params.menuId};
  db.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      next(error);
    } else {
      if (!req.body.menuItem.name || !req.body.menuItem.description || !req.body.menuItem.inventory || !req.body.menuItem.price) {
        return res.sendStatus(400);
      }
     // Menu exists, body-variables are okay so let's move on and update.
      const sql = 'UPDATE MenuItem SET name=$name, description=$description, inventory=$inventory, price=$price, menu_id = $menuId WHERE MenuItem.id=$menuItemId';
      const values = {
        $name: req.body.menuItem.name,
        $description: req.body.menuItem.description,
        $inventory: req.body.menuItem.inventory,
        $price: req.body.menuItem.price,
        $menuId: req.params.menuId,
        $menuItemId: req.params.menuItemId};

      db.run(sql, values, function(error) {
        if (error){
          next(error);
        } else {
          db.get(`SELECT * FROM MenuItem WHERE menuItem.id = ${req.params.menuItemId}`,
            (error, menuitem) => {
              res.status(200).json({menuItem: menuitem});
            });
        }
      });
    }
  });
});

/*delete the menu-item after the check that the menu-item exists. Don't know why to check if the menu exists though. It would not break
//any constraint if the menu would not exist. */

menuitemsRouter.delete('/:menuItemId', (req, res, next) => {
  // first check if Menu exists
  const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValues = {$menuId: req.params.menuId};
  db.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      res.sendStatus(404);
      next(error);
    } else {

     //moving on. Menu exists
    const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
    const values = {$menuItemId: req.params.menuItemId};

    db.run(sql, values, (error) => {
      if (error) {
        res.sendStatus(404);
        next(error);
      } else {
      res.sendStatus(204);
      }
    });
    }
  });
});



module.exports = menuitemsRouter;
