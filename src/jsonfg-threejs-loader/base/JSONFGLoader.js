import { Vector3 } from 'three';
import {
	BufferAttribute,
	BufferGeometry,
	Group,
	Matrix4 } from 'three';
import proj4 from 'proj4';
const defs = require("proj4js-definitions");
// import { FeatureParser } from '../parsers/FeatureParser.js';

export class JSONFGLoader {

	constructor( parser ) {

		// this.texturesPath = '';
		this.scene = new Group();
		this.matrix = null;
		this.boundingBox = null;
		this.parser = parser;// || new FeatureParser();

		// Load proj4 defs
		proj4.defs(defs);
		proj4.defs("EPSG:7415","+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs +no_defs");

		this.targetCRS = "EPSG:4326";

	}

	// setTexturesPath( path ) {

	// 	this.texturesPath = path;

	// }

	load( data ) {

		if ( typeof data === "object" ) {

			// We dee[] clone the object to avoid modifying the original
			// objects vertices
			let new_data = JSON.parse(JSON.stringify(data));

			this.reprojectData( new_data );

			if ( this.matrix == null && new_data.features.length > 0 ) {

				this.computeMatrix( new_data.features );

			}

			this.parser.matrix = this.matrix;
			this.parser.parse( new_data, this.scene );

		}

	}

	reprojectData( data ) {
		if (data.coordRefSys) {
			if (data.coordRefSys.includes("//www.opengis.net/def/crs/EPSG/0/")) {
				this.targetCRS = 'EPSG:' + data.coordRefSys.split("/").at(-1);
			} else {
				console.error("Unsupported coordRefSys string");
				try {
					proj4(this.targetCRS);
				} catch (error) {
					console.error(error);
				}
			}
		} else return;

		if (this.targetCRS === 'EPSG:4326') return;

		// let context = this;
		const reprojectCoordinates = (coords) => coords.map(geom => {
			if (typeof geom[0] === 'number') {
				return proj4(this.targetCRS, geom);
			} else
				return reprojectCoordinates(geom);
		});

		// reproject
		for ( const featureID in data.features ) {
			let feature = data.features[featureID];
			if(feature.geometry)
				feature.geometry.coordinates = reprojectCoordinates(feature.geometry.coordinates);
		}
	}

	// applyTransform( data ) {

	// 	// apply CRS transform
	// 	if ( data[ "transform" ] != undefined ) {

	// 		const t = data.transform.translate;
	// 		const s = data.transform.scale;

	// 		const vertices = data.vertices.map( v =>
	// 			[
	// 				v[ 0 ] * s[ 0 ] + t[ 0 ],
	// 				v[ 1 ] * s[ 1 ] + t[ 1 ],
	// 				v[ 2 ] * s[ 2 ] + t[ 2 ]
	// 			]
	// 		);

	// 		return vertices;

	// 	}

	// 	return data.vertices;

	// }

	/**
	 * Computes a matrix that transforms the dataset close to the origin.
	 *
	 * @param {Array} features An array of features to compute the matrix for
	 */
	computeMatrix( features, scale = false ) {

		const normGeom = new BufferGeometry();

		//get the first vertex of the first face of the polyhedrons
		// If you want to get the complete first face instead, use feature.place.coordinates[ 0 ][ 0 ].flat().flat()
		const faces = [];
		for ( const feature of features ) {

			if ( feature.hasOwnProperty( 'place' ) ) {

				if ( feature.place !== null ) {

					// TODO: GeometryCollection / CustomGeometry, MultiPrism
					if ( feature.place.type == "MultiPolyhedron" ) faces.push( feature.place.coordinates[ 0 ][ 0 ][ 0 ][ 0 ][ 0 ] );
					else if ( feature.place.type == "Polyhedron" ) faces.push( feature.place.coordinates[ 0 ][ 0 ][ 0 ][ 0 ] );
					else if ( feature.place.type == "MultiPolygon" ) faces.push( feature.place.coordinates[ 0 ][ 0 ][ 0 ] );
					else if ( feature.place.type == "Polygon" || feature.place.type == "MultiLineString" ) faces.push( feature.place.coordinates[ 0 ][ 0 ] );
					else if ( feature.place.type == "LineString" || feature.place.type == "MultiPoint" ) faces.push( feature.place.coordinates[ 0 ] );
					else if ( feature.place.type == "Point" ) faces.push( feature.place.coordinates );
					else if ( feature.place.type == "Prism" ) {
						if ( feature.place.base.type == "Polygon" ) faces.push( feature.place.coordinates[ 0 ][ 0 ] );
						else if ( feature.place.base.type == "LineString" ) faces.push( feature.place.coordinates[ 0 ] );
						else if ( feature.place.base.type == "Point" ) faces.push( feature.place.coordinates );
					}
				}

			}

		}

		const vertices = new Float32Array( faces.flat() );
		normGeom.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );

		normGeom.computeBoundingBox();
		this.boundingBox = normGeom.boundingBox;
		const centre = new Vector3();

		normGeom.boundingBox.getCenter( centre );
		centre.setZ( 0 );
		normGeom.computeBoundingSphere();
		const radius = normGeom.boundingSphere.radius;

		// const s = scale ? radius === 0 ? 1 : 1.0 / radius : 1;
		const s = radius === 0 ? 1 : 0.25 / radius;

		const matrix = new Matrix4();
		matrix.set(
			s, 0, 0, - s * centre.x,
			0, s, 0, - s * centre.y,
			0, 0, s, - s * centre.z,
			0, 0, 0, 1
		);

		this.matrix = matrix;

	}

}
