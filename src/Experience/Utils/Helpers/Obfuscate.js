import * as THREE from 'three'

import vertexObfuscateShader from '@experience/Shaders/Obfuscate/vertex.glsl'
import fragmentObfuscateShader from '@experience/Shaders/Obfuscate/fragment.glsl'

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Obfuscate {

    static _instance = null
    metaOffset = 8

    static getInstance() {
        return Obfuscate._instance || new Obfuscate()
    }

    constructor() {
        // Singleton
        if ( Obfuscate._instance ) {
            return Obfuscate._instance
        }

        Obfuscate._instance = this
    }


    loadFile( filename, callback ) {
        return fetch( filename )
            .then( ( response ) => {
                if ( !response.ok ) {
                    throw new Error( `Failed to load binary file '${ filename }'` );
                }

                response.arrayBuffer().then( ( arrayBuffer ) => {
                    callback( arrayBuffer )
                } )
            } );
    }

    decode( arrayBuffer, source, callback ) {
        const metaOffset = this.metaOffset

        /* WEBGL DEOBFUSCATE */
        // In Data (Uint8Array)
        const inputFileData = new Uint8Array( arrayBuffer );
        const dataSize = inputFileData.length;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
        const renderer = new THREE.WebGLRenderer();

        const maxTextureSize = renderer.capabilities.maxTextureSize; // usually from 8192 to 16384

        // Calculate the width and height of the 2D texture
        const width = Math.min( maxTextureSize, Math.ceil( Math.sqrt( dataSize ) ) );
        const height = Math.ceil( dataSize / width );

        // Set the correct data alignment
        const gl = renderer.getContext();
        gl.pixelStorei( gl.PACK_ALIGNMENT, 1 );

        // Create a data array exactly matching the texture size
        const paddedData = new Uint8Array( width * height );

        // Copy the input data into the paddedData array
        paddedData.set( inputFileData );

        // Create a texture from the file data (using THREE.RedFormat)
        const texture = new THREE.DataTexture( paddedData, width, height, THREE.RedFormat );
        texture.needsUpdate = true;

        // Shader material for deobfuscating the data
        const material = new THREE.ShaderMaterial( {
            uniforms: {
                u_texture: { value: texture },
                u_mask: { value: 0.6667 }, // Mask for XOR operation (0xAA / 255)
            },
            vertexShader: vertexObfuscateShader,
            fragmentShader: fragmentObfuscateShader
        } );

        // Create a plane to display the texture
        const planeGeometry = new THREE.PlaneGeometry( 2, 2 );
        const plane = new THREE.Mesh( planeGeometry, material );
        scene.add( plane );

        // Create a framebuffer for rendering the result
        const renderTarget = new THREE.WebGLRenderTarget( width, height, {
            format: THREE.RedFormat,
            type: THREE.UnsignedByteType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            depthBuffer: false,
            stencilBuffer: false
        } );

        // Set the renderer to the correct size
        renderer.setSize( width, height );

        // Render the scene to the framebuffer
        renderer.setRenderTarget( renderTarget );
        renderer.render( scene, camera );

        // Read the pixels from the framebuffer
        const obfuscatedData = new Uint8Array( width * height );
        renderer.readRenderTargetPixels( renderTarget, 0, 0, width, height, obfuscatedData );

        const arrayBufferTexture = new ArrayBuffer( width * height );
        new Uint8Array( arrayBufferTexture ).set( obfuscatedData );

        const fileArrayBuffer = arrayBufferTexture.slice( 0, arrayBuffer.byteLength )


        const dataView = new DataView( fileArrayBuffer );

        // Read the metadata length from the beginning of the ArrayBuffer
        const metaLength = Number( dataView.getBigUint64( 0, true ) );
        //console.log( 'metaLength', Number( metaLength ) )


        // Read the metadata from the ArrayBuffer
        const decoder = new TextDecoder();
        const metadataString = decoder.decode( new Uint8Array( fileArrayBuffer, metaOffset, metaLength ) );
        const metadata = JSON.parse( metadataString );
        //console.log( 'metadata', metadata )

        // Read the file data from the ArrayBuffer
        const fileData = new Uint8Array( fileArrayBuffer, metaOffset + metaLength );
        const fileDataBuffer = fileData.buffer.slice( metaOffset + metaLength )
        //console.log( 'fileDataBuffer', fileDataBuffer )

        const loader = new GLTFLoader()

        switch ( metadata.type ) {
            case 'gltfModel':
                loader.parse( fileDataBuffer, source.path, ( gltf ) => {
                    gltf.metadata = metadata
                    callback && callback( gltf )
                } )
                break
            case 'json':
                const jsonData = JSON.parse( decoder.decode( fileData ) )
                callback && callback( jsonData )
                break
            case 'texture':
                callback && callback( fileDataBuffer, fileData  )
                break
        }
    }

    // Write a binary file to the disk
    saveBinaryFile( buffer, filename ) {
        // Если вы используете браузер
        const blob = new Blob( [ buffer ], { type: 'application/octet-stream' } );
        const link = document.createElement( 'a' );
        link.href = URL.createObjectURL( blob );
        link.download = filename;
        document.body.appendChild( link );
        link.click();
        document.body.removeChild( link );
    }

}
