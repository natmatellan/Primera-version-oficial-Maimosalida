const fs = require('fs').promises;
const path = require('path');


const express = require('express');
const app = express();
app.use(express.json());
// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));


// Ruta para crear carpetas
app.post('/model/:category', async (req, res) => {
    const { category } = req.params;
    const result = await createModelCategoryFolder(category);
    
    if (result.success) {
        res.status(201).json(result);
    } else {
        res.status(400).json(result);
    }
});

// Nueva ruta GET para obtener carpetas
app.get('/model/folders', async (req, res) => {
    const result = await getModelFolders();
    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(500).json(result);
    }
});

// Ruta para obtener subcarpetas de una categoría específica
app.get('/model/:category/folders', async (req, res) => {
    const { category } = req.params;
    const result = await getSubcategoryFolders(category);
    
    if (result.success) {
        res.status(200).json(result);
    } else {
        // Diferenciar entre "no existe" (404) y "error del servidor" (500)
        const statusCode = result.message?.includes('no existe') ? 404 : 500;
        res.status(statusCode).json(result);
    }
});

// Nuevo endpoint POST para subcategorías
app.post('/model/:category/:subcategory', async (req, res) => {
    const { category, subcategory } = req.params;
    const result = await createModelSubcategoryFolder(category, subcategory);
    
    if (result.success) {
        res.status(201).json(result);
    } else {
        res.status(400).json(result);
    }
});

// Nuevos endpoints
app.post('/model/:category/:subcategory/add-brand', express.json(), async (req, res) => {
    const { category, subcategory } = req.params;
    const { brand } = req.body;
    try {
        // 1. Agregar la marca al JSON (existente)
        const jsonResult = await addBrandToSubcategory(category, subcategory, brand);
        
        if (!jsonResult.success) {
            return res.status(400).json(jsonResult);
        }

        // 2. Crear estructura de carpetas para la marca
        const folderResult = await createBrandFolders(category, subcategory, brand);
        
        if (!folderResult.success) {
            return res.status(500).json(folderResult);
        }

        res.status(201).json({
            success: true,
            message: `Marca ${brand} agregada exitosamente con su estructura de carpetas`,
            brandId: jsonResult.brandId,
            paths: {
                json: jsonResult.path,
                folders: folderResult.path
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al agregar marca: ${error.message}`
        });
    }

});

app.post('/model/:category/:subcategory/:brand/add-product', express.json(), async (req, res) => {
    const { category, subcategory, brand } = req.params;
    const { product, quantity, imagePath, description } = req.body;
    try {
        // 1. Agregar producto al JSON (existente)
        const jsonResult = await addProductToBrand(category, subcategory, brand, product, {
            quantity,
            imagePath,
            description
        });
        
        if (!jsonResult.success) {
            return res.status(400).json(jsonResult);
        }

        // 2. Crear estructura de carpetas para el producto
        const folderResult = await createProductFolders(category, subcategory, brand, product);
        
        if (!folderResult.success) {
            return res.status(500).json(folderResult);
        }

        res.status(201).json({
            success: true,
            message: `Producto ${product} agregado exitosamente con su estructura de tickets`,
            productId: jsonResult.productId,
            paths: {
                json: jsonResult.path,
                folders: folderResult.paths
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al agregar producto: ${error.message}`
        });
    }
});

/**
 * Obtiene marcas de un JSON de subcategoría
 */
app.get('/model/:category/:subcategory/brands', async (req, res) => {
    const { category, subcategory } = req.params;
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');

    const jsonFilePath = path.join(__dirname, 'model', sanitizedCategory, sanitizedSubcategory, `${sanitizedSubcategory}.json`);

    try {
        const data = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(data);
            console.log(jsonData)
            console.log("i feelet")

        res.status(200).json({
            success: true,
            brands: jsonData[sanitizedSubcategory] || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al leer marcas: ${error.message}`
        });
    }
});

/**
 * Obtiene el JSON completo de una subcategoría
 */
app.get('/model/:category/:subcategory/json', async (req, res) => {
    const { category, subcategory } = req.params;
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');

    const jsonFilePath = path.join(__dirname, 'model', sanitizedCategory, sanitizedSubcategory, `${sanitizedSubcategory}.json`);

    try {
        const data = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(data);
        
        res.status(200).json({
            success: true,
            jsonData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al leer JSON: ${error.message}`
        });
    }
});

// Endpoint para agregar un ticket
app.post('/model/:category/:subcategory/:brand/:product/add-sale', express.json(), async (req, res) => {
    const { category, subcategory, brand, product } = req.params;
    const { price } = req.body;
    console.log(req.body)
    console.log(product+"Aca!!")
    try {
        const result = await addSaleToProduct(category, subcategory, brand, product, price);
        res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al agregar ticket: ${error.message}`
        });
    }
});


// Endpoint para obtener productos de una marca específica
app.get('/model/:category/:subcategory/:brand/products', async (req, res) => {
    const { category, subcategory, brand } = req.params;
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');

    const jsonFilePath = path.join(
        __dirname, 
        'model', 
        sanitizedCategory, 
        sanitizedSubcategory, 
        `${sanitizedSubcategory}.json`
    );

    try {
        const data = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(data);
        //console.log(jsonData)
        // Encontrar la marca específica
        const brandData = jsonData[sanitizedSubcategory].find(b => b.marca === brand);
        
        if (!brandData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Marca no encontrada' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            products: brandData.productos || [] 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: `Error al obtener productos: ${error.message}` 
        });
    }
});

// Función auxiliar para agregar ticket
async function addSaleToProduct(category, subcategory, brand, product, price) {
    const currentHour = new Date().getHours();
    const ticketNumber = currentHour + 1;

    try {
        // 1. Actualizar el JSON principal
        const jsonFilePath = path.join(
            __dirname,
            'model',
            encodeURIComponent(category),
            encodeURIComponent(subcategory),
            `${encodeURIComponent(subcategory)}.json`
        );
console.log(jsonFilePath)

        const jsonData = JSON.parse(await fs.readFile(jsonFilePath, 'utf8'));
        const subcategoryData = jsonData[encodeURIComponent(subcategory)];
console.log(jsonData)
        const brandIndex = subcategoryData.findIndex(b => b.marca === brand);
        if (brandIndex === -1) throw new Error("Marca no encontrada");
//ACAA nombre = product
        console.log(product)
        const productIndex = subcategoryData[brandIndex].productos.findIndex(p => p.producto === product);
        if (productIndex === -1) throw new Error("Producto no encontrado");

        const newTicket = {
            mercadoId: "M001", // Temporal
            precio: parseFloat(price),
            timestamp: new Date().toISOString()
        };

        subcategoryData[brandIndex].productos[productIndex].tickets.push(newTicket);
        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));

        // 2. Actualizar el ticket específico
        const ticketPath = path.join(
            __dirname,
            'model',
            'tickets',
            encodeURIComponent(category),
            encodeURIComponent(subcategory),
            encodeURIComponent(brand),
            encodeURIComponent(product),
            `ticket${ticketNumber}.json`
        );

        let ticketData = { product: { 
            category: encodeURIComponent(category),
            subcategory: encodeURIComponent(subcategory),
            brand: encodeURIComponent(brand),
            tickets: [] 
        }};

        try {
            const existingData = await fs.readFile(ticketPath, 'utf8');
            ticketData = JSON.parse(existingData);
        } catch (e) {
            console.log("Creando nuevo archivo de ticket");
        }

        ticketData.product.tickets.push(newTicket);
        await fs.writeFile(ticketPath, JSON.stringify(ticketData, null, 2));

        return {
            success: true,
            message: "Venta registrada exitosamente",
            ticket: newTicket
        };

    } catch (error) {
        console.error("Error en addSaleProduct Backend:", error);
        return {
            success: false,
            message: `Error al registrar venta: ${error.message}`
        };
    }
}

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
// Ruta para redirigir a index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para redirigir a Maimosalida.html
app.get('/Maimosalida', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Maimosalida.html'));
});

// Ruta para redirigir a river.html
app.get('/river', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'river.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

/**
 * Obtiene la lista de carpetas en /model
 * @returns {Promise<{success: boolean, folders: string[], message?: string}>}
 */
async function getModelFolders() {
    const modelPath = path.join(__dirname, 'model');
    
    try {
        // Verificar si el directorio /model existe
        try {
            await fs.access(modelPath);
        } catch {
            // Si no existe, devolver lista vacía
            return { success: true, folders: [] };
        }

        // Leer contenido del directorio
        const items = await fs.readdir(modelPath, { withFileTypes: true });
        
        // Filtrar solo directorios
        const folders = items
            .filter(item => item.isDirectory() && item.name !== 'tickets')
            .map(item => item.name);

         // Filtrar para excluir la carpeta 'tickets' si existe
        //const filteredFolders = folders.filter(folder => folder !== 'tickets');
        
        return { success: true, folders };
    } catch (error) {
        console.error('Error al leer carpetas:', error);
        return {
            success: false,
            folders: [],
            message: 'Error al leer las carpetas existentes'
        };
    }
}

/**
 * Obtiene la lista de subcarpetas en /model/:category
 * @param {string} category - Nombre de la categoría padre
 * @returns {Promise<{success: boolean, folders: string[], message?: string}>}
 */
async function getSubcategoryFolders(category) {
    // Sanitizar el nombre de la categoría
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const categoryPath = path.join(__dirname, 'model', sanitizedCategory);
    
    try {
        // Verificar si el directorio existe
        try {
            await fs.access(categoryPath);
        } catch {
            return { 
                success: false,
                folders: [],
                message: `La categoría "${sanitizedCategory}" no existe`
            };
        }

        // Leer contenido del directorio
        const items = await fs.readdir(categoryPath, { withFileTypes: true });
        
        // Filtrar solo directorios (ignorar archivos como los .json)
        const folders = items
            .filter(item => item.isDirectory())
            .map(item => item.name);
        
        return { success: true, folders };
    } catch (error) {
        console.error(`Error al leer subcarpetas en ${categoryPath}:`, error);
        return {
            success: false,
            folders: [],
            message: 'Error al leer las subcarpetas existentes'
        };
    }
}

/**
 * Crea una carpeta dentro de /model/:category y replica en /model/tickets/:category
 * @param {string} category - Nombre de la categoría (subdirectorio)
 * @returns {Promise<{success: boolean, message: string, paths?: string[]}>} - Resultado de la operación
 */
async function createModelCategoryFolder(category) {
    // Validar nombre de categoría
    if (!category || typeof category !== 'string') {
        return {
            success: false,
            message: 'El nombre de la categoría no es válido'
        };
    }

    // Sanitizar el nombre de la categoría (remover caracteres peligrosos)
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    
    // Rutas base donde se crearán las carpetas
    const baseModelPath = path.join(__dirname, 'model');
    const baseTicketsPath = path.join(__dirname, 'model', 'tickets');
    
    const categoryModelPath = path.join(baseModelPath, sanitizedCategory);
    const categoryTicketsPath = path.join(baseTicketsPath, sanitizedCategory);

    try {
        // Verificar/crear carpetas base
        await fs.mkdir(baseModelPath, { recursive: true });
        await fs.mkdir(baseTicketsPath, { recursive: true });

        // Crear las carpetas de categoría en ambas ubicaciones
        await Promise.all([
            fs.mkdir(categoryModelPath, { recursive: true }),
            fs.mkdir(categoryTicketsPath, { recursive: true })
        ]);
        
        return {
            success: true,
            message: `Carpetas creadas exitosamente en: 
                      model/${sanitizedCategory} 
                      y model/tickets/${sanitizedCategory}`,
            paths: [categoryModelPath, categoryTicketsPath]
        };
    } catch (error) {
        console.error(`Error al crear carpetas para ${sanitizedCategory}:`, error);
        return {
            success: false,
            message: `Error al crear las carpetas: ${error.message}`
        };
    }
}

/**
 * Crea una subcarpeta dentro de /model/:category/:subcategory 
 * y replica en /model/tickets/:category/:subcategory
 * @param {string} category - Nombre de la categoría principal
 * @param {string} subcategory - Nombre de la subcategoría
 * @returns {Promise<{success: boolean, message: string, paths?: string[]}>}
 */
async function createModelSubcategoryFolder(category, subcategory) {
    // Validar inputs
    if (!category || typeof category !== 'string' || 
        !subcategory || typeof subcategory !== 'string') {
        return {
            success: false,
            message: 'Nombres de categoría y subcategoría no válidos'
        };
    }

    // Sanitizar nombres
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');

    const baseModelPath = path.join(__dirname, 'model');
    const baseTicketsPath = path.join(__dirname, 'model', 'tickets');
    
    const fullModelPath = path.join(baseModelPath, sanitizedCategory, sanitizedSubcategory);
    const fullTicketsPath = path.join(baseTicketsPath, sanitizedCategory, sanitizedSubcategory);
    const jsonFilePath = path.join(fullModelPath, `${sanitizedSubcategory}.json`);

    try {
        // Verificar si existen las categorías padre
        const categoryModelPath = path.join(baseModelPath, sanitizedCategory);
        const categoryTicketsPath = path.join(baseTicketsPath, sanitizedCategory);
        
        await Promise.all([
            fs.access(categoryModelPath),
            fs.access(categoryTicketsPath)
        ]);

        // Crear las subcarpetas en ambas ubicaciones
        await Promise.all([
            fs.mkdir(fullModelPath, { recursive: true }),
            fs.mkdir(fullTicketsPath, { recursive: true })
        ]);
        
        const initialJson = {
            [sanitizedSubcategory]: []
        };
        
        await fs.writeFile(jsonFilePath, JSON.stringify(initialJson, null, 2));
        
        return {
            success: true,
            message: `Subcarpetas y .json creados exitosamente en: 
                     model/${sanitizedCategory}/${sanitizedSubcategory}
                     y model/tickets/${sanitizedCategory}/${sanitizedSubcategory}`,
            paths: [fullModelPath, fullTicketsPath, jsonFilePath]
        };
    } catch (error) {
        console.error(`Error al crear subcarpetas para ${sanitizedCategory}/${sanitizedSubcategory}:`, error);
        
        // Determinar qué error específico ocurrió
        let errorMessage = `Error al crear las subcarpetas: ${error.message}`;
        if (error.code === 'ENOENT') {
            errorMessage = `La categoría padre "${sanitizedCategory}" no existe en alguna de las ubicaciones`;
        }
        
        return {
            success: false,
            message: errorMessage
        };
    }
}

/**
 * Agrega una nueva marca al JSON
 */
async function addBrandToSubcategory(category, subcategory, brand) {
    // Validaciones
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedBrand = brand.replace(/[^a-zA-Z0-9-_]/g, '');

    const jsonFilePath = path.join(__dirname, 'model', sanitizedCategory, sanitizedSubcategory, `${sanitizedSubcategory}.json`);

    try {
        // Leer archivo existente
        const data = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(data);
        
        // Generar ID único (ejemplo simple)
        const brandId = Date.now().toString().slice(-8);
        
        // Agregar nueva marca
        jsonData[sanitizedSubcategory].push({
            marca: sanitizedBrand,
            marcaId: brandId,
            productos: []
        });
        
        // Guardar cambios
        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));
        
        return {
            success: true,
            message: `Marca "${sanitizedBrand}" agregada exitosamente`,
            brandId
        };
    } catch (error) {
        console.error('Error al agregar marca:', error);
        return {
            success: false,
            message: `Error al agregar marca: ${error.message}`
        };
    }
}

/**
 * Agrega un producto a una marca
 */
async function addProductToBrand(category, subcategory, brand, product, details) {
    // Validaciones y sanitización
     const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedBrand = brand.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedProduct = product.replace(/[^a-zA-Z0-9-_]/g, '');
    
    const jsonFilePath = path.join(__dirname, 'model', sanitizedCategory, sanitizedSubcategory, `${sanitizedSubcategory}.json`);

    try {
        const data = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(data);
        
        // Encontrar la marca
        const brandIndex = jsonData[sanitizedSubcategory].findIndex(b => b.marca === brand);
        if (brandIndex === -1) {
            return { success: false, message: 'Marca no encontrada' };
        }
        
        // Generar ID de producto
        const productId = Date.now().toString().slice(-9);
        
        // Agregar producto
        jsonData[sanitizedSubcategory][brandIndex].productos.push({
            productoId: productId,
            producto: sanitizedProduct,
            cantidad: details.quantity,
            img: details.imagePath,
            descripcion: details.description,
            tickets: []
        });
        
        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));
        
        return {
            success: true,
            message: `Producto "${sanitizedProduct}" agregado exitosamente`,
            productId
        };
    } catch (error) {
        console.error('Error al agregar producto:', error);
        return {
            success: false,
            message: `Error al agregar producto: ${error.message}`
        };
    }
}



/***  TICKETS MANAGER  ***/

// Función para inicializar los 24 tickets de un producto
async function initializeProductTickets(category, subcategory, brand, productId) {
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedBrand = brand.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedProductId = productId.replace(/[^a-zA-Z0-9-_]/g, '');

    // Crear los 24 tickets vacíos
    for (let i = 1; i <= 24; i++) {
        const ticketPath = path.join(
            __dirname, 
            'model', 
            'tickets',
            sanitizedCategory,
            sanitizedSubcategory,
            sanitizedBrand,
            sanitizedProductId,
            `ticket${i}.json`
        );

        const ticketData = {
            product: {
                category: sanitizedCategory,
                subcategory: sanitizedSubcategory,
                brand: sanitizedBrand,
                tickets: []
            }
        };

        await fs.writeFile(ticketPath, JSON.stringify(ticketData, null, 2));
    }
}

// Función para agregar una venta (ticket)
async function addSale(category, subcategory, brand, product) {
   
    const currentHour = new Date().getHours(); // Hora actual (0-23)
    const ticketNumber = currentHour + 1; // ticket1 a ticket24
 console.log(ticketNumber)
    try {
        // Obtener el producto para actualizar su lista de tickets
        //ACAAA
        const productResponse = await fetch(`/model/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}/brands`);
        const productData = await productResponse.json();
        
        if (!productData.success) throw new Error("No se pudo obtener el producto");

        const selectedBrand = productData.brands.find(b => b.marcaId === brand);
        const selectedProduct = selectedBrand.productos.find(p => p.productoId === productId);

        // Crear nuevo ticket
        const newTicket = {
            mercadoId: "M001", // Temporal - se implementará luego
            precio: parseFloat(price),
            timestamp: new Date().toISOString()
        };

        // Agregar ticket al producto
        selectedProduct.tickets.push(newTicket);

        // Actualizar el ticket específico (hora actual)
        const ticketPath = path.join(
            __dirname,
            'model',
            'tickets',
            encodeURIComponent(category),
            encodeURIComponent(subcategory),
            encodeURIComponent(brand),
            encodeURIComponent(product),
            `ticket${ticketNumber}.json`
        );

        let ticketData = { product: { category, subcategory, brand, tickets: [] } };
        try {
            const existingData = await fs.readFile(ticketPath, 'utf8');
            ticketData = JSON.parse(existingData);
        } catch (e) {
            console.log("Creando nuevo ticket file");
        }

        ticketData.product.tickets.push(newTicket);
        await fs.writeFile(ticketPath, JSON.stringify(ticketData, null, 2));

        // Actualizar el producto en el JSON principal
        await updateProductInJson(category, subcategory, brand, productId, selectedProduct);

        alert("Venta registrada exitosamente");
        loadProductsTable(); // Refrescar la tabla
    } catch (error) {
        console.error("Error al registrar venta:", error);
        alert("Error al registrar venta");
    }
}



// Función para actualizar un producto en el JSON principal
async function updateProductInJson(category, subcategory, brand, productId, updatedProduct) {
    const jsonFilePath = path.join(
        __dirname,
        'model',
        encodeURIComponent(category),
        encodeURIComponent(subcategory),
        `${encodeURIComponent(subcategory)}.json`
    );

    try {
        const data = await fs.readFile(jsonFilePath, 'utf8');
        const jsonData = JSON.parse(data);

        const brandIndex = jsonData[subcategory].findIndex(b => b.marcaId === brand);
        if (brandIndex === -1) throw new Error("Marca no encontrada");

        const productIndex = jsonData[subcategory][brandIndex].productos.findIndex(p => p.productoId === productId);
        if (productIndex === -1) throw new Error("Producto no encontrado");

        jsonData[subcategory][brandIndex].productos[productIndex] = updatedProduct;
        await fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        throw error;
    }
}


/**
 * Crea estructura de carpetas para una nueva marca
 * @param {string} category - Categoría
 * @param {string} subcategory - Subcategoría
 * @param {string} brand - Nombre de la marca
 * @returns {Promise<{success: boolean, message: string, path?: string}>}
 */
async function createBrandFolders(category, subcategory, brand) {
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedBrand = brand.replace(/[^a-zA-Z0-9-_]/g, '');

    const brandPath = path.join(
        __dirname,
        'model',
        'tickets',
        sanitizedCategory,
        sanitizedSubcategory,
        sanitizedBrand
    );

    try {
        await fs.mkdir(brandPath, { recursive: true });
        return {
            success: true,
            message: `Carpeta de marca creada en: model/tickets/${sanitizedCategory}/${sanitizedSubcategory}/${sanitizedBrand}`,
            path: brandPath
        };
    } catch (error) {
        console.error(`Error al crear carpeta de marca: ${error}`);
        return {
            success: false,
            message: `Error al crear carpeta de marca: ${error.message}`
        };
    }
}


/**
 * Crea estructura de carpetas y tickets para un nuevo producto
 * @param {string} category - Categoría
 * @param {string} subcategory - Subcategoría
 * @param {string} brand - Marca
 * @param {string} product - Nombre del producto
 * @returns {Promise<{success: boolean, message: string, paths?: string[]}>}
 */
async function createProductFolders(category, subcategory, brand, product) {
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedSubcategory = subcategory.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedBrand = brand.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedProduct = product.replace(/[^a-zA-Z0-9-_]/g, '');

    const productPath = path.join(
        __dirname,
        'model',
        'tickets',
        sanitizedCategory,
        sanitizedSubcategory,
        sanitizedBrand,
        sanitizedProduct
    );

    const historyPath = path.join(productPath, 'history');

    try {
        // Crear carpeta principal del producto
        await fs.mkdir(productPath, { recursive: true});
        
        // Crear carpeta history
        await fs.mkdir(historyPath, { recursive: true });

        // Crear los 24 archivos de ticket
        const ticketPaths = [];
        const ticketData = {
            product: {
                category: sanitizedCategory,
                subcategory: sanitizedSubcategory,
                brand: sanitizedBrand,
                tickets: []
            }
        };

        for (let i = 1; i <= 24; i++) {
            const ticketPath = path.join(productPath, `ticket${i}.json`);
            await fs.writeFile(ticketPath, JSON.stringify(ticketData, null, 2));
            ticketPaths.push(ticketPath);
        }

        return {
            success: true,
            message: `Estructura de producto creada con 24 tickets y carpeta history`,
            paths: [productPath, historyPath, ...ticketPaths]
        };
    } catch (error) {
        console.error(`Error al crear estructura de producto: ${error}`);
        return {
            success: false,
            message: `Error al crear estructura de producto: ${error.message}`
        };
    }
}



