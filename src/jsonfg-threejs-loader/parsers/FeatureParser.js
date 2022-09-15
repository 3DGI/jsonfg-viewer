import {
	Face3,
	BufferGeometry,
	BufferAttribute,
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

		for ( const feature in data.features ) {
			
			const geom = this.parseFeature( feature );

			const objectType = feature.featureType;

			const material = new MeshLambertMaterial();
			material.color.setHex( this.objectColors[ objectType ] );

			const mesh = new Mesh( geom, material );
			mesh.name = feature.id;
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			scene.add( mesh );

		}

	}

	parseFeature( feature ) {

		if ( ! ( feature.place ) ) {

		  return;

		}

		const geom = new BufferGeometry();
		let vertices = [];

		//each geometrytype must be handled different
		const geomType = feature.place.type;

		// TODO: check all possible geomTypes
		// for now I just looked at: https://github.com/3DGI/cityjson2jsonfg/blob/4f7e537417226aee1f575d7587abbd2ff2339885/cityjson2jsonfg/convert.py#L136

		if ( geomType == "Polyhedron" ) {

			const shells = feature.place.coordinates;

			for ( let i = 0; i < shells.length; i ++ ) {

				this.parseShell( geom, shells[ i ], vertices, json );

			}

		} else if ( geomType == "MultiPolygon" || geomType == "CompositeSurface" ) {

			const surfaces = feature.place.coordinates;

			this.parseShell( geom, surfaces, vertices, json );

		} else if ( geomType == "MultiSolid" || geomType == "CompositeSolid" ) {

			const solids = feature.place.coordinates;

			for ( let i = 0; i < solids.length; i ++ ) {

				for ( let j = 0; j < solids[ i ].length; j ++ ) {

					this.parseShell( geom, solids[ i ][ j ], vertices, json );

				}

			}

		}


		if ( this.matrix !== null ) {

			geom.applyMatrix4( this.matrix );

		}

		geom.computeFaceNormals();

		return geom;

	}

	parseShell( geom, boundaries, vertices, json ) {

		const positions = [];
		const normals = [];

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

			// see if we need to triangulate
			if ( vertices.length == 3 ) {

				positions.push( ...vertices );
				normals.push(normal, normal, normal);

			} else if ( vertices.length > 3 ) {		

				//convert to 2d (for triangulation)
				let pv = [];
				for ( let k = 0; k < vertices.length; k ++ ) {

					const re = this.to_2d( vertices[ k ], normal );
					pv.push( re.x );
					pv.push( re.y );

				}

				//triangulate
				const tr = earcut( pv, holes, 2 );

				//create faces based on triangulation
				for ( let k = 0; k < tr.length; k += 3 ) {

					positions.push( vertices[ tr[ k ] ] )
					positions.push( vertices[ tr[ k + 1 ] ] )
					positions.push( vertices[ tr[ k + 2 ] ] )
					normals.push(normal, normal, normal);

				}

			}

		}

		function disposeArray() {

			this.array = null;

		}

		geom.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ).onUpload( disposeArray ) );

	}

	// extractLocalIndices( geom, boundary, indices, json ) {

	// 	let new_boundary = [];

	// 	for ( let j = 0; j < boundary.length; j ++ ) {

	// 		//the original index from the json file
	// 		const index = boundary[ j ];

	// 		//if this index is already there
	// 		if ( indices.includes( index ) ) {

	// 			const vertPos = indices.indexOf( index );
	// 			new_boundary.push( vertPos );

	// 		} else {

	// 			// Add vertex to geometry
	// 			const point = new Vector3(
	// 				json.vertices[ index ][ 0 ],
	// 				json.vertices[ index ][ 1 ],
	// 				json.vertices[ index ][ 2 ]
	// 			);
	// 			geom.vertices.push( point );

	// 			new_boundary.push( indices.length );
	// 			indices.push( index );

	// 		}

	// 	}

	// 	return new_boundary;

	// }

	get_normal_newell( points ) {

		// find normal with Newell's method
		let n = [ 0.0, 0.0, 0.0 ];

		for ( let i = 0; i < points.length; i ++ ) {

		  let nex = i + 1;

		  if ( nex == points.length ) {

				nex = 0;

			}

		  n[ 0 ] = n[ 0 ] + ( ( points[ i ].y - points[ nex ].y ) * ( points[ i ].z + points[ nex ].z ) );
		  n[ 1 ] = n[ 1 ] + ( ( points[ i ].z - points[ nex ].z ) * ( points[ i ].x + points[ nex ].x ) );
		  n[ 2 ] = n[ 2 ] + ( ( points[ i ].x - points[ nex ].x ) * ( points[ i ].y + points[ nex ].y ) );

		}

		const b = new Vector3( n[ 0 ], n[ 1 ], n[ 2 ] );
		return ( b.normalize() );

	}

	to_2d( p, n ) {

		p = new Vector3( p.x, p.y, p.z );
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

		const re = { x: x, y: y };

		return re;

	}

}
