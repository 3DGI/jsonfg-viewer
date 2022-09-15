import {
	Face3,
	BufferGeometry,
	BufferAttribute,
	Mesh,
	MeshLambertMaterial,
	Vector3 } from 'three';
import earcut from 'earcut';

export class CityObjectParser {

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

		// Contains the boundary but with the right verticeId
		for ( let i = 0; i < boundaries.length; i ++ ) {

			let boundary = [];
			let holes = [];

			for ( let j = 0; j < boundaries[ i ].length; j ++ ) {

				if ( boundary.length > 0 ) {

					holes.push( boundary.length );

				}

				const new_boundary = this.extractLocalIndices( geom, boundaries[ i ][ j ], vertices, json );
				boundary.push( ...new_boundary );

			}

			if ( boundary.length == 3 ) {

				geom.faces.push( new Face3( boundary[ 0 ], boundary[ 1 ], boundary[ 2 ] ) );

			} else if ( boundary.length > 3 ) {

				//create list of points
				let pList = [];
				for ( let k = 0; k < boundary.length; k ++ ) {

					pList.push( {
						x: json.vertices[ vertices[ boundary[ k ] ] ][ 0 ],
						y: json.vertices[ vertices[ boundary[ k ] ] ][ 1 ],
						z: json.vertices[ vertices[ boundary[ k ] ] ][ 2 ]
					} );

				}

				//get normal of these points
				const normal = this.get_normal_newell( pList );

				//convert to 2d (for triangulation)
				let pv = [];
				for ( let k = 0; k < pList.length; k ++ ) {

					const re = this.to_2d( pList[ k ], normal );
					pv.push( re.x );
					pv.push( re.y );

				}

				//triangulate
				const tr = earcut( pv, holes, 2 );

				//create faces based on triangulation
				for ( let k = 0; k < tr.length; k += 3 ) {

					geom.faces.push(
						new Face3(
							boundary[ tr[ k ] ],
							boundary[ tr[ k + 1 ] ],
							boundary[ tr[ k + 2 ] ]
						)
					);

				}

			}

		}

	}

	extractLocalIndices( geom, boundary, indices, json ) {

		let new_boundary = [];

		for ( let j = 0; j < boundary.length; j ++ ) {

			//the original index from the json file
			const index = boundary[ j ];

			//if this index is already there
			if ( indices.includes( index ) ) {

				const vertPos = indices.indexOf( index );
				new_boundary.push( vertPos );

			} else {

				// Add vertex to geometry
				const point = new Vector3(
					json.vertices[ index ][ 0 ],
					json.vertices[ index ][ 1 ],
					json.vertices[ index ][ 2 ]
				);
				geom.vertices.push( point );

				new_boundary.push( indices.length );
				indices.push( index );

			}

		}

		return new_boundary;

	}

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
