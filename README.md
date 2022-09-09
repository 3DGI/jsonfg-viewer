# JSON-FG viewer

# Use

## Public version

You can run the `jsonfg-viewer` without installation by visiting ...

## Installation

Install all dependencies:

```
yarn install
```

### Compile and run for development

```
yarn run dev
```

You can visit the local version at: [http://localhost:9080/dist/index.html](http://localhost:9080/dist/index.html).

### Compile and run for production

```
yarn run build
```

# Dependencies

*ninja* uses [cityjson-vue-components](https://github.com/cityjson/cityjson-vue-components) and [cityjson-threejs-loader](https://github.com/cityjson/cityjson-threejs-loader) to handle things.

Other frameworks used:
- [three.js](https://threejs.org/)
- [Vue.js](https://vuejs.org/)
- [Bootstrap](https://getbootstrap.com/)
- [Parcel.js](https://parceljs.org/)

# Attribution

The JSON-FG viewer is an adaptation of the [CityJSON viewer](https://viewer.cityjson.org) and its components, namely [cityjson-vue-components](https://github.com/cityjson/cityjson-vue-components) and [cityjson-threejs-loader](https://github.com/cityjson/cityjson-threejs-loader).