import { Vector3 } from 'three';
import {
	BufferAttribute,
	BufferGeometry,
	Group,
	Matrix4 } from 'three';
import { FeatureParser } from '../parsers/FeatureParser.js';

export class JSONFGLoader {

	constructor( parser ) {

		this.texturesPath = '';
		this.scene = new Group();
		this.matrix = null;
		this.boundingBox = null;
		this.parser = parser || new FeatureParser();

	}

	setTexturesPath( path ) {

		this.texturesPath = path;

	}

	load( data ) {

		if ( typeof data === "object" ) {

			// We shallow clone the object to avoid modifying the original
			// objects vertices
			// TODO: implement this for json-fg
			const new_data = Object.assign( {}, data );

			// new_data.vertices = this.applyTransform( data );

			if ( this.matrix == null && data.features.length > 0 ) {

				this.computeMatrix( data.features );

			}

			this.parser.matrix = this.matrix;
			this.parser.parse( data, this.scene );

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
