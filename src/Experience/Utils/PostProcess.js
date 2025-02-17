import * as THREE from 'three'
import Experience from '../Experience.js'
import Debug from '../Utils/Debug.js'
import State from "../State.js";
import Sizes from "./Sizes.js";
import Materials from "../Materials/Materials.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MotionBlurPass } from '../Passes/motionBlurPass/src/MotionBlurPass.js';
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import FBO from "./FBO.js";

import BloomVertex from '../Shaders/Bloom/vertex.glsl'
import BloomFragment from '../Shaders/Bloom/fragment.glsl'

import ClearVertex from '../Shaders/Clear/vertex.glsl'
import ClearFragment from '../Shaders/Clear/fragment.glsl'

import CompositeMaterialFragment from '../Shaders/Bloom/CompositeMaterial/fragment.glsl'

export default class PostProcess {
    experience = Experience.getInstance()
    debug = Debug.getInstance()
    sizes = Sizes.getInstance()
    state = State.getInstance()
    materials = Materials.getInstance()
    fbo = FBO.getInstance()

    rendererClass = this.experience.renderer
    scene = experience.scene
    time = experience.time
    camera = experience.camera.instance
    resources = experience.resources
    timeline = experience.time.timeline;
    container = new THREE.Group();

    constructor( renderer ) {
        this.renderer = renderer
        this.setComposer()
        this.setDebug()
    }

    setComposer() {
        /**
         * Passes
         */
        // Render pass
        this.renderPass = new RenderPass( this.scene, this.camera )

        this.bloomComposer = this._bloomComposer()
        this.mixPass = this._mixPass()
        this.outputPass = new OutputPass()
        //this.motionBlurPass = this._motionBlurPass()
        this.bokehPass = this._bokehPass()

        this.renderTarget = this.fbo.createRenderTarget( this.sizes.width, this.sizes.height, false, false, 0 )
        this.composer = new EffectComposer( this.renderer, this.renderTarget )
        this.composer.setSize( this.sizes.width, this.sizes.height )
        this.composer.setPixelRatio( this.sizes.pixelRatio )

        this.composer.addPass( this.renderPass )
        this.composer.addPass( this.bokehPass )
        //this.composer.addPass( this.mixPass )
        //this.composer.addPass( this.unrealBloomPass )
        //this.composer.addPass( this.motionBlurPass )
        this.composer.addPass( this.outputPass )
    }

    _bloomComposer() {

        this.renderTargetBloom = this.fbo.createRenderTarget( this.sizes.width, this.sizes.height, false, false, 0 )

        this.unrealBloomPass = this._bloomPass()

        const bloomComposer = new EffectComposer( this.renderer, this.renderTargetBloom );
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass( this.renderPass );
        bloomComposer.addPass( this.unrealBloomPass )

        return bloomComposer
    }

    _bloomPass() {
        const unrealBloomPass = new UnrealBloomPass(
            new THREE.Vector2( this.sizes.width, this.sizes.height ),
            this.state.unrealBloom.strength,
            this.state.unrealBloom.radius,
            this.state.unrealBloom.threshold
        )

        unrealBloomPass.enabled = this.state.unrealBloom.enabled
        unrealBloomPass.renderToScreen = false

        unrealBloomPass.tintColor = {}
        unrealBloomPass.tintColor.value = '#000000'
        unrealBloomPass.tintColor.instance = new THREE.Color( unrealBloomPass.tintColor.value )

        unrealBloomPass.compositeMaterial.uniforms.uTintColor = { value: unrealBloomPass.tintColor.instance }
        unrealBloomPass.compositeMaterial.uniforms.uTintStrength = { value: 0.15 }
        //unrealBloomPass.compositeMaterial.fragmentShader = CompositeMaterialFragment

        return unrealBloomPass
    }

    _mixPass() {
        const mixPass = new ShaderPass(
            new THREE.ShaderMaterial( {
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
                },
                vertexShader: BloomVertex,
                fragmentShader: BloomFragment,
                defines: {}
            } ), 'baseTexture'
        );
        mixPass.needsSwap = true;

        return mixPass
    }

    _bokehPass() {
        const bokehPass = new BokehPass( this.scene, this.camera, {
            focus: 1.0,
            aperture: 5 * 0.00001,
            maxblur: 0.01
        } );

        return bokehPass
    }

    _clearPass() {
        const clearPass = new ShaderPass(
            new THREE.ShaderMaterial( {
                uniforms: {
                    baseTexture: { value: null },
                    u_DepthTexture: new THREE.Uniform(),
                    u_Resolution: new THREE.Uniform( new THREE.Vector2( this.sizes.width * this.sizes.pixelRatio, this.sizes.height * this.sizes.pixelRatio ) ),
                    cameraNear: { value: this.camera.near },
                    cameraFar: { value: this.camera.far },
                    u_TransitionTexture: { value: null },
                    u_TransitionProgress: new THREE.Uniform( -0.2 ),
                    u_TransitionTextureResolution: new THREE.Uniform( new THREE.Vector4() ),
                    u_ScreenShow: new THREE.Uniform( false ),
                },
                vertexShader: ClearVertex,
                fragmentShader: ClearFragment,
                defines: {}
            } ), 'baseTexture'
        );
        clearPass.needsSwap = true;

        return clearPass
    }

    _motionBlurPass() {
        const motionBlurPass = new MotionBlurPass( this.scene, this.camera );

        motionBlurPass.enabled = this.state.motionBlur.enabled;
        motionBlurPass.samples = this.state.motionBlur.samples;
        motionBlurPass.expandGeometry = this.state.motionBlur.expandGeometry;
        motionBlurPass.interpolateGeometry = this.state.motionBlur.interpolateGeometry;
        motionBlurPass.renderCameraBlur = this.state.motionBlur.cameraBlur;
        motionBlurPass.smearIntensity = this.state.motionBlur.smearIntensity;
        motionBlurPass.jitter = this.state.motionBlur.jitter;
        motionBlurPass.jitterStrategy = this.state.motionBlur.jitterStrategy;

        return motionBlurPass;
    }

    resize() {
        this.composer.setSize( this.sizes.width, this.sizes.height )
        this.composer.setPixelRatio( this.sizes.pixelRatio )

        this.bloomComposer?.setSize( this.sizes.width, this.sizes.height )
        this.bloomComposer?.setPixelRatio( this.sizes.pixelRatio )
    }

    setDebug() {
        if ( !this.debug.active ) return

        if ( this.debug.panel ) {

            const postProcessFolder = this.debug.panel.addFolder( {
                title: 'PostProcess', expanded: true
            } );
            const bloomFolder = postProcessFolder.addFolder( {
                title: 'UnrealBloomPass', expanded: false
            } );


            bloomFolder.addBinding( this.unrealBloomPass, 'enabled', { label: 'Enabled' } ).on( 'change', () => {
                this.mixPass.enabled = this.unrealBloomPass.enabled;
            } );

            bloomFolder.addBinding( this.unrealBloomPass, 'strength', {
                min: 0, max: 5, step: 0.001, label: 'Strength'
            } );

            bloomFolder.addBinding( this.unrealBloomPass, 'radius', {
                min: -2, max: 1, step: 0.001, label: 'Radius'
            } );

            bloomFolder.addBinding( this.unrealBloomPass, 'threshold', {
                min: 0, max: 1, step: 0.001, label: 'Threshold'
            } );

            bloomFolder.addBinding( this.unrealBloomPass.tintColor, 'value', {
                label: 'Tint Color', view: 'color'
            } ).on( 'change', () => {
                this.unrealBloomPass.tintColor.instance.set( this.unrealBloomPass.tintColor.value );
            } );

            bloomFolder.addBinding( this.unrealBloomPass.compositeMaterial.uniforms.uTintStrength, 'value', {
                min: 0, max: 1, step: 0.001, label: 'Tint Strength'
            } );

            const bokehFolder = postProcessFolder.addFolder( {
                title: 'BokehPass', expanded: true
            } );

            bokehFolder.addBinding( this.bokehPass, 'enabled', { label: 'Enabled' } );

            bokehFolder.addBinding( this.bokehPass.uniforms.focus, 'value', {
                min: 0.0, max: 3000.0, step: 0.001, label: 'Focus'
            } )

            bokehFolder.addBinding( this.bokehPass.uniforms.aperture, 'value', {
                min: 0, max: 0.00001, step: 0.000001, label: 'Aperture'
            } )

            bokehFolder.addBinding( this.bokehPass.uniforms.maxblur, 'value', {
                min: 0.0, max: 0.01, step: 0.001, label: 'Max Blur'
            } )

            console.log(this.bokehPass)

            // gui.add( effectController, 'focus', 10.0, 3000.0, 10 ).onChange( matChanger );
            // gui.add( effectController, 'aperture', 0, 10, 0.1 ).onChange( matChanger );
            // gui.add( effectController, 'maxblur', 0.0, 0.01, 0.001 ).onChange( matChanger );

            // const motionFolder = PostProcessFolder.addFolder( 'Motion Blur' );
            // motionFolder.add( this.state.motionBlur, 'enabled' )
            //     .onChange( () => {
            //         this.motionBlurPass.enabled = this.state.motionBlur.enabled
            //     } );
            // motionFolder.add( this.state.motionBlur, 'cameraBlur' )
            //     .onChange( () => {
            //         this.motionBlurPass.renderCameraBlur = this.state.motionBlur.cameraBlur
            //     } );
            // motionFolder.add( this.state.motionBlur, 'samples', 0, 50 ).step( 1 )
            //     .onChange( () => {
            //         this.motionBlurPass.samples = this.state.motionBlur.samples
            //     } );
            // motionFolder.add( this.state.motionBlur, 'jitter', 0, 5 ).step( 0.01 )
            //     .onChange( () => {
            //         this.motionBlurPass.jitter = this.state.motionBlur.jitter
            //     } );
            // motionFolder.add( this.state.motionBlur, 'jitterStrategy', {
            //     REGULAR_JITTER: MotionBlurPass.REGULAR_JITTER,
            //     RANDOM_JITTER: MotionBlurPass.RANDOM_JITTER,
            //     BLUENOISE_JITTER: MotionBlurPass.BLUENOISE_JITTER,
            // } )
            //     .onChange( () => {
            //         this.motionBlurPass.jitterStrategy = this.state.motionBlur.jitterStrategy
            //     } );
            // motionFolder.add( this.state.motionBlur, 'smearIntensity', 0, 10 )
            //     .onChange( () => {
            //         this.motionBlurPass.smearIntensity = this.state.motionBlur.smearIntensity
            //     } );
            // motionFolder.add( this.state.motionBlur, 'expandGeometry', 0, 1 )
            //     .onChange( () => {
            //         this.motionBlurPass.expandGeometry = this.state.motionBlur.expandGeometry
            //     } );
            // motionFolder.add( this.state.motionBlur, 'interpolateGeometry', 0, 1 )
            //     .onChange( () => {
            //         this.motionBlurPass.interpolateGeometry = this.state.motionBlur.interpolateGeometry
            //     } );
            // motionFolder.add( this.state.motionBlur, 'renderTargetScale', 0, 1 )
            // 	.onChange( v => {
            //         MotionBlurPass.renderTargetScale = v;
            //         window.resizeTo();
            // 	} );
            //
            // motionFolder.add( this.motionBlurPass.debug, 'display', {
            // 	'Motion Blur': MotionBlurPass.DEFAULT,
            // 	'Velocity': MotionBlurPass.VELOCITY,
            // 	'Geometry': MotionBlurPass.GEOMETRY
            // } ).onChange( val => this.motionBlurPass.debug.display = parseFloat(val) );
            // motionFolder.close()
        }
    }

    bloomRender() {
        if ( this.unrealBloomPass.enabled ) {
            //this.scene.traverse( this.materials._darkenNonBloomed )
            this.bloomComposer.render()
            //this.scene.traverse( this.materials._restoreMaterial )
        }

    }

    productionRender() {
        if ( this.state.postprocessing ) {
            this.bloomRender()

            this.composer.render()
        } else {
            this.renderer.render( this.scene, this.camera )
        }
    }

    debugRender() {
        if ( this.state.postprocessing ) {
            this.bloomRender()

            this.renderer.autoClear = false
            this.composer.render()
            this.renderer.clearDepth()
        } else {
            this.renderer.autoClear = false
            this.renderer.clearColor( this.rendererClass.clearColor )
            this.renderer.render( this.scene, this.camera )
            this.renderer.clearDepth()
        }
    }

    update( deltaTime ) {
        if ( this.debug.active ) {
            this.debugRender()
        } else {
            this.productionRender()
        }

    }

}
