const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.

//-----------------------------------------------------------------------//
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('videogame', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      defaultValue: "customer created game",
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    released: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    platforms: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    create: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
		timestamps: false
  });
};
