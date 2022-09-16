import {
	BufferGeometry,
	Float32BufferAttribute,
	Mesh,
	MeshLambertMaterial,
	Vector3 } from 'three';
import earcut from 'earcut';

export class FeatureParser {

	constructor() {

		this.matrix = null;

		this.objectColors = {
			"Building": 0x7497df,
			"BuildingPart": 0x7497df,
			"BuildingInstallation": 0x7497df,
			"Bridge": 0x999999,
			"BridgePart": 0x999999,
			"BridgeInstallation": 0x999999,
			"BridgeConstructionElement": 0x999999,
			"CityObjectGroup": 0xffffb3,
			"CityFurniture": 0xcc0000,
			"GenericCityObject": 0xcc0000,
			"LandUse": 0xffffb3,
			"PlantCover": 0x39ac39,
			"Railway": 0x000000,
			"Road": 0x999999,
			"SolitaryVegetationObject": 0x39ac39,
			"TINRelief": 0xffdb99,
			"TransportSquare": 0x999999,
			"Tunnel": 0x999999,
			"TunnelPart": 0x999999,
			"TunnelInstallation": 0x999999,
			"WaterBody": 0x4da6ff
		};

	}

	parse( data, scene ) {

		for ( const feature of data.features ) {
			
			const geom = this.parseFeature( feature );

			const objectType = feature.featureType;

			const material = new MeshLambertMaterial();
			material.color.setHex( this.objectColors[ objectType ] );
			// material.side = DoubleSide;

			const mesh = new Mesh( geom, material );
			mesh.name = feature.id;
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			scene.add( mesh );

		}

	}

	parseFeature( feature ) {


		if ( ! ( feature.place ) ) {

			console.log("Feature has no place")
			console.log(feature)
		  return;

		}

		const geom = new BufferGeometry();
		const positions = [];
		const normals = [];

		//each geometrytype must be handled different
		const geomType = feature.place.type;

		// TODO: check all possible geomTypes
		// for now I just looked at: https://github.com/3DGI/cityjson2jsonfg/blob/4f7e537417226aee1f575d7587abbd2ff2339885/cityjson2jsonfg/convert.py#L136



		if ( geomType == "Polyhedron" ) {

			const shells = feature.place.coordinates;

			for ( let i = 0; i < shells.length; i ++ ) {

				this.parseShell( geom, shells[ i ], positions, normals );

			}

		} else if ( geomType == "MultiPolygon" ) {

			const surfaces = feature.place.coordinates;

			this.parseShell( geom, surfaces, positions, normals );

		} else if ( geomType == "MultiPolyhedron" ) {

			const solids = feature.place.coordinates;

			for ( let i = 0; i < solids.length; i ++ ) {

				for ( let j = 0; j < solids[ i ].length; j ++ ) {

					this.parseShell( geom, solids[ i ][ j ], positions, normals );

				}

			}

		} else if ( goemType == "Point" ) {
			console.log( "Point 'place' type is not supported" );
		} else if ( goemType == "MultiPoint" ) {
			console.log( "MultiPoint 'place' type is not supported" );
		} else if ( goemType == "LineString" ) {
			console.log( "LineString 'place' type is not supported" );
		} else if ( goemType == "MultiLineString" ) {
			console.log( "MultiLineString 'place' type is not supported" );
		} else if ( goemType == "Polygon" ) {
			console.log( "Polygon 'place' type is not supported" );
		} else if ( goemType == "Prism" ) {
			console.log( "Prism 'place' type is not supported" );
		} else if ( goemType == "MultiPrism" ) {
			console.log( "MultiPrism 'place' type is not supported" );
		} else if ( goemType == "CustomGeometry" ) {
			console.log( "CustomGeometry 'place' type is not supported" );
		} else {
			console.log( "Invalid 'place' type ", geomType );
		}


		// function disposeArray() {

		// 	this.array = null;

		// }

		// geom.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
		geom.setAttribute( 'position', new Float32BufferAttribute( positions.flat(), 3 ) );
		geom.setAttribute( 'normal', new Float32BufferAttribute( normals.flat(), 3 ) );


		if ( this.matrix !== null ) {

			geom.applyMatrix4( this.matrix );

		}

		geom.computeFaceNormals();

		return geom;

	}

	parseShell( geom, boundaries, positions, normals ) {

		// Contains the boundary but with the right verticeId
		for ( let i = 0; i < boundaries.length; i ++ ) {

			let vertices = [];
			let holes = [];

			for ( let j = 0; j < boundaries[ i ].length; j ++ ) {

				if ( vertices.length > 0 ) {

					holes.push( vertices.length );

				}

				// const new_boundary = this.extractLocalIndices( geom, boundaries[ i ][ j ], vertices, json );
				vertices.push( ...boundaries[ i ][ j ] );

			}
			
			
			// get normal of these points
			const normal = this.get_normal_newell( vertices );
			const normal_ = normal.toArray();

			// see if we need to triangulate
			if ( vertices.length == 3 ) {

				positions.push( ...vertices );
				normals.push(normal_, normal_, normal_);

			} else if ( vertices.length > 3 ) {		

				//convert to 2d (for triangulation)
				let pv = [];
				for ( let k = 0; k < vertices.length; k ++ ) {

					const re = this.to_2d( vertices[ k ], normal );
					pv.push( re[0] );
					pv.push( re[1] );

				}

				//triangulate
				const tr = earcut( pv, holes, 2 );

				//create faces based on triangulation
				for ( let k = 0; k < tr.length; k += 3 ) {

					positions.push( vertices[ tr[ k ] ] )
					positions.push( vertices[ tr[ k + 1 ] ] )
					positions.push( vertices[ tr[ k + 2 ] ] )
					normals.push(normal_, normal_, normal_);

				}

			}

		}

	}

	get_normal_newell( points ) {

		// find normal with Newell's method
		let n = [ 0.0, 0.0, 0.0 ];

		for ( let i = 0; i < points.length; i ++ ) {

		  let nex = i + 1;

		  if ( nex == points.length ) {

				nex = 0;

			}

		  n[ 0 ] = n[ 0 ] + ( ( points[ i ][1] - points[ nex ][1] ) * ( points[ i ][2] + points[ nex ][2] ) );
		  n[ 1 ] = n[ 1 ] + ( ( points[ i ][2] - points[ nex ][2] ) * ( points[ i ][0] + points[ nex ][0] ) );
		  n[ 2 ] = n[ 2 ] + ( ( points[ i ][0] - points[ nex ][0] ) * ( points[ i ][1] + points[ nex ][1] ) );

		}

		const b = new Vector3( n[ 0 ], n[ 1 ], n[ 2 ] );
		return ( b.normalize() );

	}

	to_2d( p, n ) {

		p = new Vector3( p[ 0 ], p[ 1 ], p[ 2 ] );
		const x3 = new Vector3( 1.1, 1.1, 1.1 );
		if ( x3.distanceTo( n ) < 0.01 ) {

		  x3.add( new Vector3( 1.0, 2.0, 3.0 ) );

		}

		let tmp = x3.dot( n );
		let tmp2 = n.clone();
		tmp2.multiplyScalar( tmp );
		x3.sub( tmp2 );
		x3.normalize();

		let y3 = n.clone();
		y3.cross( x3 );

		let x = p.dot( x3 );
		let y = p.dot( y3 );

		return [ x, y ];

	}

}
