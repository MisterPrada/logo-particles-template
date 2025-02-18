import * as THREE from 'three'
import Model from './Abstracts/Model.js'
import Experience from '../Experience.js'
import Debug from '../Utils/Debug.js'
import State from "../State.js";
import Materials from "../Materials/Materials.js";

import * as Helpers from '../Utils/Helpers.js'

import particlesFragmentShader from '../Shaders/Particles/fragment.glsl'
import particlesVertexShader from '../Shaders/Particles/vertex.glsl'
import gsap from "gsap";

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
    postprocessing = experience.postProcess

    constructor() {
        super()

        this.setModel()
        //this.setDebug()
    }

    postInit() {

    }

    setModel() {
        const logoGeometry = this.logo.logoGeometry
        const logoPositions = this.logo.positions


        //const logoGeometry = this.logo.mergedLogoGeometry.clone()
        const logoGeometryTexture = Helpers.makeTexture( logoGeometry )

        // Geometry
        const particlesGeometry = new THREE.BufferGeometry()

        const particlesCount = logoPositions.length / 3
        const positionArray = new Float32Array( particlesCount * 3 )
        const randomArray = new Float32Array( particlesCount * 3 )
        const scaleArray = new Float32Array( particlesCount )

        for ( let i = 0; i < particlesCount; i++ ) {
            const isLeft = i % 2 === 0 ? -1 : 1; // Alternating left and right

            positionArray[ i * 3 + 0 ] = ( Math.random() - 0.5 ) * 2 + isLeft * 3
            positionArray[ i * 3 + 1 ] = ( Math.random() - 0.5 ) * 5
            //positionArray[ i * 3 + 1 ] = 0
            positionArray[ i * 3 + 2 ] = ( Math.random()  ) * 10 + 30
            //positionArray[ i * 3 + 2 ] = 30

            scaleArray[ i ] = Math.random()

            randomArray[ i * 3 + 0 ] = Math.random()
            randomArray[ i * 3 + 1 ] = Math.random()
            randomArray[ i * 3 + 2 ] = Math.random()
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
        //particlesGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute(colors, 4) )
        particlesGeometry.setAttribute( 'aScale', new THREE.BufferAttribute( scaleArray, 1 ) )
        particlesGeometry.setAttribute( 'aRandom', new THREE.BufferAttribute( randomArray, 3 ) )
        particlesGeometry.setAttribute( 'aParticlesUv', new THREE.BufferAttribute( particlesUvArray, 2 ) )

        particlesGeometry.needsUpdate = true

        const pointsMaterial = this.pointsMaterial = new THREE.PointsMaterial( {
            //color: 0xffffff,
            //map: this.resources.items.particleTexture,
            alphaMap: this.resources.items.particleTexture,
            //vertexColors: true,
            size: 0.1,
            sizeAttenuation: true,
            //depthWrite: false,
            //depthTest: true,
            alphaTest: 0.2,
            transparent: true,
            blending: THREE.AdditiveBlending,
            toneMapped: true,
        } );

        pointsMaterial.onBeforeCompile = shader => {
            pointsMaterial.uniforms = shader.uniforms;
            shader.uniforms.uProgress = new THREE.Uniform( 0.5 )
            shader.uniforms.uLogoTexture = new THREE.Uniform( logoGeometryTexture )
            //shader.uniforms.uLogoColorsTexture = new THREE.Uniform( logoTexture )
            //shader.uniforms.uPixelRatio = { value: Math.min( window.devicePixelRatio, 2 ) }
            shader.uniforms.uTime =  new THREE.Uniform( 0.0 )
            shader.uniforms.uNoiseFrequencyParticles =  new THREE.Uniform( 0.653 )
            shader.uniforms.uNoiseFrequencyLogo =  new THREE.Uniform( 0.870 )


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

        debugFolder.addBinding( this.pointsMaterial.uniforms.uNoiseFrequencyParticles, "value", {
            min: 0.001,
            max: 10,
            step: 0.001,
            label: "uNoiseFrequencyParticles"
        } )

        debugFolder.addBinding( this.pointsMaterial.uniforms.uNoiseFrequencyLogo, "value", {
            min: 0.001,
            max: 10,
            step: 0.001,
            label: "uNoiseFrequencyLogo"
        } )

        const animationButton = debugFolder.addButton({
            label: 'Animation',   // optional
            title: 'Start',
        });

        animationButton.on('click', () => {
            this._animationButtonClick()
        })
    }

    _animationButtonClick() {
        this.pointsMaterial.uniforms.uProgress.value = 0
        this.postprocessing.cocMaterial.uniforms.focusRange.value = 0

        gsap.killTweensOf( this.pointsMaterial.uniforms.uProgress )
        gsap.to( this.pointsMaterial.uniforms.uProgress, {
            duration: 10,
            value: 1.0,
            ease: "power1.out",
            onUpdate: () => {

            },
        } )

        gsap.to( this.postprocessing.cocMaterial.uniforms.focusRange, {
            delay: 4,
            duration: 10,
            value: 0.2,
            ease: "power1.out",
        } )

        // this.pointsMaterial.uniforms.uProgress.value = 0
        // console.log('Animation button clicked');
    }

    update( deltaTime ) {
        if ( this.pointsMaterial.uniforms ) {
            this.pointsMaterial.uniforms.uTime.value = this.time.elapsed
        }
    }

}
