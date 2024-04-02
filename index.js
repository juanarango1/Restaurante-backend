const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

let users = require('./users.json');
let products = require('./products.json');
let pedidos = require('./pedidos.json');
let ventas = require('./ventas.json');

app.get('/modificar', (req, res) => {
  res.json(pedidos);
});

app.get('/', (req, res) => {
  res.send('¡Bienvenido al servidor!');
});


app.put('/modificar/:id', (req, res) => {
  const { id } = req.params;
  const { estadoPedido } = req.body;

  const pedido = pedidos.find(pedido => pedido.id === id);

  if (!pedido) {
    return res.status(404).json({ message: 'Pedido no encontrado' });
  }

  pedido.estadoPedido = estadoPedido;

  fs.writeFileSync('./pedidos.json', JSON.stringify(pedidos, null, 2));

  res.json({ message: 'Estado del pedido actualizado correctamente' });
});


const registrarVenta = (venta) => {
  try {
    let ventas = [];
    const data = fs.readFileSync('./ventas.json', 'utf8');
    if (data) {
      ventas = JSON.parse(data);
      
      const ventaExistente = ventas.find(v => v.id === venta.id);
      if (ventaExistente) {
        console.log('Venta ya registrada:', venta);
        return; 
      }
    }
    ventas.push(venta);
    fs.writeFileSync('./ventas.json', JSON.stringify(ventas, null, 2));
    console.log('Venta registrada:', venta);
  } catch (error) {
    console.error('Error al cargar las ventas:', error);
  }
};

fs.readFile('./pedidos.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo de pedidos:', err);
    return;
  }

  const pedidos = JSON.parse(data);

  pedidos.forEach((pedido) => {
    const { mesero, productos, total, id } = pedido;
    const venta = {
      mesero,
      productos,
      total,
      id
    };
    registrarVenta(venta);
  });
});

app.get('/ventas', (req, res) => {
  try {
    const data = fs.readFileSync('./ventas.json', 'utf8');
    ventas = JSON.parse(data);
    res.json(ventas);
  } catch (error) {
    console.error('Error al cargar las ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Usuario Inválido' });
  }

  res.json({ message: 'Sesión iniciada', user });
});

app.post('/crear-usuario', (req, res) => {
  const { username, password, role } = req.body;
  const newUser = { username, password, role };
  const existingUserIndex = users.findIndex(user => user.username === username);
  if (existingUserIndex !== -1) {
    return res.status(400).json({ error: 'El usuario ya existe. Por favor, elige otro nombre de usuario.' });
  } else {
    users.push(newUser);
    fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
    res.json({ message: 'Usuario creado correctamente' });
  }
});

app.post('/crear-producto', (req, res) => {
  const { name, price } = req.body;
  const newProduct = { name, price };
  const existingProductIndex = products.findIndex(product => product.name === name);

  if (existingProductIndex !== -1) {
    products[existingProductIndex].price = price;
    fs.writeFileSync('./products.json', JSON.stringify(products, null, 2));
    return res.status(400).json({ error: 'El producto ya existe. se actualizo su precio.' });
  } else {
    products.push(newProduct);
    fs.writeFileSync('./products.json', JSON.stringify(products, null, 2));
    res.json({ message: 'Producto creado correctamente' });
  }
});

app.get('/users', (req, res) => {
  let writeUsers = fs.readFileSync('./users.json', 'utf-8');
  users = JSON.parse(writeUsers);
  res.json(users);
});

app.get('/products', (req, res) => {
  let writeProducts = fs.readFileSync('./products.json', 'utf-8');
  products = JSON.parse(writeProducts);
  res.json(products);
});

app.post('/pedidos', (req, res) => {
  const nuevoPedido = req.body;

  fs.readFile('./pedidos.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de pedidos:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    pedidos = JSON.parse(data);

    nuevoPedido.id = (new Date()).getTime().toString();

    pedidos.push(nuevoPedido);


    fs.writeFile('./pedidos.json', JSON.stringify(pedidos, null, 2), err => {
      if (err) {
        console.error('Error al escribir en el archivo de pedidos:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      const { mesero, productos, total } = nuevoPedido;
      const venta = { mesero, productos, total };
      registrarVenta(venta);
      res.json({ message: 'Pedido creado correctamente', pedido: nuevoPedido });
    });
  });
});

app.put('/users/:username', (req, res) => {
  const username = req.params.username;
  const updatedUserData = req.body;

  fs.readFile('./users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de usuarios:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    let users = JSON.parse(data);

    const updatedUsers = users.map(user => {
      if (user.username === username) {
        return { ...user, ...updatedUserData };
      }
      return user;
    });

    fs.writeFile('./users.json', JSON.stringify(updatedUsers, null, 2), err => {
      if (err) {
        console.error('Error al escribir en el archivo de usuarios:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      res.json(updatedUsers);
    });
  });
});

app.delete('/users/:username', (req, res) => {
  const username = req.params.username;

  fs.readFile('./users.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de usuarios:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    let users = JSON.parse(data);

    const updatedUsers = users.filter(user => user.username !== username);

    fs.writeFile('./users.json', JSON.stringify(updatedUsers, null, 2), err => {
      if (err) {
        console.error('Error al escribir en el archivo de usuarios:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.json(users);
    });
  });
});

app.put('/products/:name', (req, res) => {
  const name = req.params.name;
  const updatedProductData = req.body;

  fs.readFile('./products.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de productos:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    let products = JSON.parse(data);

    const updatedProducts = products.map(product => {
      if (product.name === name) {
        return { ...product, ...updatedProductData };
      }
      return product;
    });

    fs.writeFile('./products.json', JSON.stringify(updatedProducts, null, 2), err => {
      if (err) {
        console.error('Error al escribir en el archivo de productos:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      res.json(updatedProducts);
    });
  });
});

app.delete('/products/:name', (req, res) => {
  const name = req.params.name;

  fs.readFile('./products.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de productos:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    let products = JSON.parse(data);

    const updatedProducts = products.filter(product => product.name !== name);

    fs.writeFile('./products.json', JSON.stringify(updatedProducts, null, 2), err => {
      if (err) {
        console.error('Error al escribir en el archivo de usuarios:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      res.json(products);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en el puerto ${PORT}`);
});
