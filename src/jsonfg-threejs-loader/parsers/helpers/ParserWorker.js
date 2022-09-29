import 'regenerator-runtime/runtime';
import { ChunkParser } from './ChunkParser.js';

// when this worker receives a message
onmessage = function ( e ) {

	const parser = new ChunkParser();

	const props = e.data[ 1 ];

	if ( props ) {

		if ( props.chunkSize ) {

			parser.chunkSize = props.chunkSize;

		}

		if ( props.objectColors ) {

			parser.objectColors = props.objectColors;

		}

		if ( props.lods ) {

			parser.lods = props.lods;

		}

	}

	parser.onchunkload = ( v, geometryData, lods, objectColors ) => {

		const vertexArray = new Float32Array( v );
		const vertexBuffer = vertexArray.buffer;

		const msg = {
			type: "chunkLoaded",
			v_buffer: vertexBuffer,
			geometryData,
			lods,
			objectColors
			// surfaceColors
		};
		// send data back to parent
		postMessage( msg, [ vertexBuffer ] );

	};

	parser.onComplete = () => {

		this.postMessage( { type: "done" } );

	};

	parser.parse( e.data[ 0 ] );

};

