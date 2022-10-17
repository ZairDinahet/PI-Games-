const { Router, response } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const {Videogame, Genre, videogames_genre} = require('../db');
const axios = require('axios');
const {API_KEY} = process.env;


const router = Router();
// Configurar los routers;
// Ejemplo: router.use('/auth', authRouter);

//                                                                    FUNCTIONS GET;

// Modificar esta funcion y hacerlo con un axios.all( [axios.get(url), axios.get(url), axios.get(url), axios.get(url)....])
// const getApiGames = async () => {
//     const totalGames = [];
//     for (let i = 1; i <= 5; i++) {
//         let api = await axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=${i}`);
//         api.data.results.map(g => {
//             totalGames.push({
//                 id: g.id,
//                 name: g.name,
//                 image: g.background_image,
//                 released: g.released,
//                 rating: g.rating,
//                 genres: g.genres.map(g => g.name).join(', '),
//                 platforms: g.platforms.map(p => p.platform.name).join(', '),
//                 create: false,
//             })
//         })
//     }
//     return totalGames;
// };

const getApiGames = async () => {
    let totalGames = [];
    for (let i = 1; i <= 5; i++) {
        totalGames.push(axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=${i}`));
    }
    totalGames = await axios.all(totalGames);
    totalGames = totalGames.map(g => g.data.results).flat(1);
    totalGames = totalGames.map(g => {
        return {
            id: g.id,
            name: g.name,
            image: g.background_image,
            released: g.released,
            rating: g.rating,
            genres: g.genres.map(g => g.name).join(', '),
            platforms: g.platforms.map(p => p.platform.name).join(', '),
            create: false,
        }
    })
    return totalGames;
};




const getDbGames = async () => {
    const dbGames = await Videogame.findAll({
        include: {
            model: Genre,
            attributes: ["name"],
            through: {
                attributes: [],
            },
        },
    })
    return dbGames;
}

const allGames = async () => {
    const api = await getApiGames();
    const db = await getDbGames();
    return [...api, ...db]
}




    router.get('/videogames', async (req, res) => {
        const {name} = req.query;
        const allVideoGames = await allGames();
        
        if(name){
            const gameFilter = allVideoGames.filter(v => v.name.toLowerCase().includes(name.toLocaleLowerCase()));
            gameFilter.length ? 
            res.status(200).send(gameFilter) : 
            res.status(400).send("Game not found");
        } else {
            res.status(200).send(allVideoGames);
        }
    } )
    
    
    router.get('/genres', async (req, res) => {
        try {
            const apiData = await axios.get(`https://api.rawg.io/api/genres?key=${API_KEY}`)
            const validateGenders = await Genre.findAll()

            if (validateGenders.length){
                return res.status(200).send(validateGenders);
            }

            const genres = apiData.data.results.map(g => {
                return {
                    id: g.id,
                    name: g.name
                }
            })
                const genresDb = await Genre.bulkCreate(genres);            
                res.status(200).send(genresDb)

        } catch (error) {
            res.status(400).send("Error")
        }
        
    })
    
    
    router.get('/videogame/:id', async (req, res) => {
        const {id} = req.params;
    
        try {
            if(!id.includes('-')){
                const allVideoGames = await allGames();
                const gameApiFilter = allVideoGames.filter(g => g.id === parseInt(id));
        
                if(gameApiFilter.length){
                    const detail = await axios.get(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
                    const description = detail.data.description_raw;
                    gameApiFilter[0].description = description;
                    
                    res.status(200).send(gameApiFilter);
                }
            } else {
                const gameDbFilter = await Videogame.findByPk(id);
                res.status(200).send(gameDbFilter);
            }
            
        } catch (error) {
            res.status(404).send("Game not found")
        }
    
    
    })




// FALTA AGREGAR LA RELACION DE JUEGOS/GENERO
// Si en el modelo con id 
    router.post('/videogames', async (req, res) => {
    const{name, description, released, rating, platforms, genres} = req.body;
    if(!name || !description ||  !platforms) return res.status(400).send("Falta alguno de los campos obligatorios")

    const findGame = await Videogame.findAll({
        where: {name: name}
    })
    
    if(findGame.length) return res.status(400).send('The name of the game is busy')
    try {
        const newGame = await Videogame.create({
            name,
            description,
            released,
            rating,
            platforms: platforms.join(', '),
        });

        // AQUI ESTOY INTENTANDO TRAERME TODOS LOS GENEROS DE MI TABLA GENRES QUE COINCIDAD CON EL ARRAY DE GENEROS QUE ME PASARON POR BODY
        //PERO AL ENVIARLO AL addGenres(genx) no agrega nada y se rompe
        // const gen = genres.map(g => {
        //     Genre.findOne({
        //         where: {name: g}
        //     })
        // })
        // const genx = await Promise.all(gen);

        // SI SOLO ME ENVIAN UN GENERO NO HAY PROBLEMA, APARECE EN MI TABLA INTERMEDIA LA RELACION...
        // ACTUALIZACION: NO HACE FALTA RECORRER!, directamente si me llega un array de generos hago lo mismo que haria si solo me llegara un genero.
        const gen = await Genre.findAll({
            where: {name: genres}
        })

        newGame.addGenre(gen);
        
        res.status(200).send(newGame)
        
    } catch (error) {
        res.status(400).send("Error creating")
    }
    

})



module.exports = router;
