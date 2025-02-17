import * as THREE from 'three'
import Model from './Abstracts/Model.js'
import Experience from '../Experience.js'
import Debug from '../Utils/Debug.js'
import State from "../State.js";
import Materials from "../Materials/Materials.js";

import * as Helpers from '../Utils/Helpers.js'

import particlesFragmentShader from '../Shaders/Particles/fragment.glsl'
import particlesVertexShader from '../Shaders/Particles/vertex.glsl'

export default class Particles extends Model {
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
    logo = experience.world.logo

    constructor() {
        super()

        this.setModel()
        //this.setDebug()
    }

    setModel() {
        const logoGeometry = this.logo.mergedLogoGeometry.clone()
        const logoGeometryTexture = Helpers.makeTexture( logoGeometry )

        // Geometry
        const particlesGeometry = new THREE.BufferGeometry()

        const particlesCount = 50000
        const positionArray = new Float32Array( particlesCount * 3 )
        const scaleArray = new Float32Array( particlesCount )

        for ( let i = 0; i < particlesCount; i++ ) {
            const isLeft = i % 2 === 0 ? -1 : 1; // Alternating left and right

            positionArray[ i * 3 + 0 ] = ( Math.random() - 0.5 ) * 2 + isLeft * 3
            positionArray[ i * 3 + 1 ] = ( Math.random() - 0.5 ) * 5
            positionArray[ i * 3 + 2 ] = ( Math.random()  ) * 10 + 30

            scaleArray[ i ] = Math.random()
        }


        // Set Geometry UVs
        const particlesUvArray = new Float32Array( particlesCount * 2 )

        const size = Math.ceil( Math.sqrt( particlesCount ) );
        for ( let i = 0; i < particlesCount; i++ ) {
            const i2 = i * 2

            // Particles UV
            const y = Math.floor( i / size )
            const x = i - y * size

            particlesUvArray[ i2 + 0 ] = ( x + 0.5 ) / size
            particlesUvArray[ i2 + 1 ] = ( y + 0.5 ) / size
        }

        //particlesGeometry.setIndex( null )
        particlesGeometry.setAttribute( 'position', new THREE.BufferAttribute( positionArray, 3 ) )
        particlesGeometry.setAttribute( 'aScale', new THREE.BufferAttribute( scaleArray, 1 ) )
        particlesGeometry.setAttribute( 'aParticlesUv', new THREE.BufferAttribute( particlesUvArray, 2 ) )

        particlesGeometry.needsUpdate = true

        const pointsMaterial = this.pointsMaterial = new THREE.PointsMaterial( {
            color: 0xffffff,
            size: 0.5,
            sizeAttenuation: true,
            depthWrite: false,
            //depthTest: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
        } );

        pointsMaterial.onBeforeCompile = shader => {
            pointsMaterial.uniforms = shader.uniforms;
            shader.uniforms.uProgress = new THREE.Uniform( 0.5 )
            shader.uniforms.uLogoTexture = new THREE.Uniform( logoGeometryTexture )
            //shader.uniforms.uPixelRatio = { value: Math.min( window.devicePixelRatio, 2 ) }
            shader.uniforms.uTime =  new THREE.Uniform( 0.0 )
            // shader.uniforms.uResolution = new THREE.Uniform(
            //     new THREE.Vector2(
            //         this.sizes.width * this.sizes.pixelRatio,
            //         this.sizes.height * this.sizes.pixelRatio
            //     )
            // )

            shader.vertexShader = particlesVertexShader
            shader.fragmentShader = particlesFragmentShader

            this.setDebug()
        }
        pointsMaterial.needsUpdate = true

        const particles = new THREE.Points( particlesGeometry, pointsMaterial );
        particles.frustumCulled = false

        this.container.add( particles )
        this.scene.add( this.container )
    }

    resize() {

    }

    setDebug() {
        if ( !this.debug.active ) return

        const debugFolder = this.debug.panel.addFolder( {
            title: 'Particles',
            expanded: true,
        } );

        debugFolder.addBinding( this.pointsMaterial.uniforms.uProgress, "value", {
            min: 0,
            max: 1,
            step: 0.01,
            label: "Progress"
        } )
    }

    update( deltaTime ) {
        if ( this.pointsMaterial.uniforms ) {
            this.pointsMaterial.uniforms.uTime.value = this.time.elapsed
        }
    }

}
