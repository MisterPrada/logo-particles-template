import * as THREE from 'three'
import Model from './Abstracts/Model.js'
import Experience from '../Experience.js'
import Debug from '../Utils/Debug.js'
import State from "../State.js";
import Materials from "../Materials/Materials.js";

import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { LoopSubdivision } from 'three-subdivide';


export default class Logo extends Model {
    experience = Experience.getInstance()
    debug = Debug.getInstance()
    state = State.getInstance()
    materials = Materials.getInstance()
    scene = experience.scene
    time = experience.time
    camera = experience.camera.instance
    renderer = experience.renderer.instance
    resources = experience.resources
    container = new THREE.Group();

    constructor() {
        super()

        this.setModel()
        //this.setDebug()
    }

    setModel() {

        const logoSvgData = this.resources.items.logoSvg

        const group = this._getShapedGroup( logoSvgData );

        group.traverse( child => {
            if ( child.isMesh ) {
                child.geometry.scale( 0.01, 0.01, 0.01 );
                child.geometry.translate( -1, -1, 0 );
            }
        } );

        // merge all geometries in group
        let mergedLogoGeometry = this._mergeGroupGeometries( group );
        mergedLogoGeometry = this.mergedLogoGeometry = this._subdivideGeometry( mergedLogoGeometry, 2 );

        // create mesh
        const mesh = new THREE.Mesh( mergedLogoGeometry, new THREE.MeshBasicMaterial( {
            color: 0xffffff,
            wireframe: true,
            depthWrite: false,
            })
        );


        // const shader = THREE.ShaderLib['points']; // Для PointsMaterial
        //
        // function expandShader(shaderCode) {
        //     return shaderCode.replace(/#include <(.*?)>/g, (match, chunk) => {
        //         return THREE.ShaderChunk[chunk] || `// Unknown chunk: ${chunk}`;
        //     });
        // }

        //console.log(expandShader(shader.vertexShader));





        //this.container.add( group );
        //this.container.add( mesh );
        this.scene.add( this.container );
    }

    _getShapedGroup ( logoSvgData ) {
        const group = new THREE.Group();
        let renderOrder = 0

        const material = new THREE.MeshBasicMaterial( {
            side: THREE.DoubleSide,
            depthWrite: false,
        } );

        for ( const path of logoSvgData.paths ) {

            const fillColor = path.userData.style.fill;

            if ( /*guiData.drawFillShapes &&*/ fillColor !== undefined && fillColor !== 'none' ) {

                const material = new THREE.MeshBasicMaterial( {
                    color: new THREE.Color().setStyle( fillColor ),
                    opacity: path.userData.style.fillOpacity,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    //wireframe: true
                } );

                const shapes = SVGLoader.createShapes( path );

                for ( const shape of shapes ) {

                    const geometry = new THREE.ShapeGeometry( shape );
                    const mesh = new THREE.Mesh( geometry, material );
                    mesh.renderOrder = renderOrder++;

                    group.add( mesh );

                }

            }

            const strokeColor = path.userData.style.stroke;

            if ( /*guiData.drawStrokes &&*/ strokeColor !== undefined && strokeColor !== 'none' ) {

                const material = new THREE.MeshBasicMaterial( {
                    color: new THREE.Color().setStyle( strokeColor ),
                    opacity: path.userData.style.strokeOpacity,
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    //wireframe: true
                } );

                for ( const subPath of path.subPaths ) {

                    const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

                    if ( geometry ) {

                        const mesh = new THREE.Mesh( geometry, material );
                        mesh.renderOrder = renderOrder++;

                        group.add( mesh );

                    }

                }

            }

        }

        return group;
    }

    _mergeGroupGeometries( group ) {
        const geometries = [];

        group.children.forEach( mesh => {
            if ( mesh.isMesh ) {
                const geometry = mesh.geometry.clone();
                geometry.applyMatrix4( mesh.matrixWorld );
                geometries.push( geometry );
            }
        } );

        return BufferGeometryUtils.mergeGeometries( geometries );
    }

    _subdivideGeometry( geometry, iterations ) {
        const params = {
            split: true,       // optional, default: true
            uvSmooth: false,      // optional, default: false
            preserveEdges: false,      // optional, default: false
            flatOnly: true,      // optional, default: false
            maxTriangles: Infinity,   // optional, default: Infinity
        };

        return LoopSubdivision.modify( geometry, iterations, params );
    }

    resize() {

    }

    setDebug() {
        if ( !this.debug.active ) return

        this.debug.createDebugTexture( this.resources.items.displacementTexture )
    }

    update( deltaTime ) {
        //this.cube2.rotation.y += deltaTime * 20
        //this.cube.rotation.y += deltaTime * 30
    }

}
