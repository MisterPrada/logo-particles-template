import * as THREE from 'three'
import Experience from '../Experience.js'
import Debug from '../Utils/Debug.js'
import State from "../State.js";
import Sizes from "./Sizes.js";
import Materials from "../Materials/Materials.js";
import FBO from "./FBO.js";

import {
    BloomEffect,
    EffectComposer,
    EffectPass,
    RenderPass,
    BlendFunction,
    DepthOfFieldEffect, KernelSize
} from "postprocessing";


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
        const composer = this.composer = new EffectComposer( this.renderer, {
            //frameBufferType: THREE.HalfFloatType,
            powerPreference: "high-performance",
            // antialias: false,
            // stencil: false,
            depth: true
        });

        this.bloomPass = this._bloomPass();

        composer.addPass( new RenderPass( this.scene, this.camera ) );
        //composer.addPass( new EffectPass( this.camera, this.bloomPass) );

        this.depthOfFieldEffect = new DepthOfFieldEffect( this.camera, {
            focusDistance: 0,
            focusRange: 0,
            bokehScale: 5.0,
            height: 480
        });

        this.cocMaterial = this.depthOfFieldEffect.circleOfConfusionMaterial;

        this.params = {
            "coc": {
                "edge blur kernel": this.depthOfFieldEffect.blurPass.kernelSize,
                "focus": this.cocMaterial.uniforms.focusDistance.value,
                "focus length": this.cocMaterial.uniforms.focusRange.value
            },
            "resolution": this.depthOfFieldEffect.resolution.height,
            "bokeh scale": this.depthOfFieldEffect.bokehScale,
        };

        const effectPass = new EffectPass(
            this.camera,
            this.depthOfFieldEffect
        );

        composer.addPass( effectPass );

    }

    _bloomPass() {
        this.bloomParams = {
            "intensity": 6.,
            "radius": 0.493,
            "luminance": {
                "filter": true,
                "threshold": 0.0374,
                "smoothing": 1.0,
            }
        };

        return new BloomEffect(
            {
                blendFunction: BlendFunction.ADD,
                mipmapBlur: this.bloomParams.luminance.filter,
                luminanceThreshold: this.bloomParams.luminance.threshold,
                luminanceSmoothing: this.bloomParams.luminance.smoothing,
                intensity: this.bloomParams.intensity,
                radius: this.bloomParams.radius
            }
        )
    }

    resize() {
        this.composer.setSize( this.sizes.width, this.sizes.height )
        //this.composer.setPixelRatio( this.sizes.pixelRatio )

        this.bloomComposer?.setSize( this.sizes.width, this.sizes.height )
        this.bloomComposer?.setPixelRatio( this.sizes.pixelRatio )
    }

    setDebug() {
        if ( !this.debug.active ) return

        if ( this.debug.panel ) {
            const postProcessFolder = this.debug.panel.addFolder( {
                title: 'PostProcess', expanded: false
            } );


            const bloomFolder = postProcessFolder.addFolder( {
                title: 'BloomPass', expanded: true
            } );

            // blendFunction: BlendFunction.ADD,
            //     mipmapBlur: true,
            //     luminanceThreshold: 0.001,
            //     luminanceSmoothing: 0.2,
            //     intensity: 100.0,
            //     radius: 0.1

            bloomFolder.addBinding( this.bloomParams.luminance, "filter", {
                label: "Luminance Filter",
            } ).on( 'change', (e) => {
                this.bloomPass.mipmapBlurPass.enabled = e.value;
            } );


            bloomFolder.addBinding( this.bloomPass, "intensity", {
                min: 0,
                max: 200,
                step: 0.01,
                label: "Intensity"
            } )

            bloomFolder.addBinding( this.bloomPass.mipmapBlurPass, "radius", {
                min: 0,
                max: 1,
                step: 0.01,
                label: "Radius"
            } )

            bloomFolder.addBinding( this.bloomPass.luminanceMaterial, "threshold", {
                min: 0,
                max: 1,
                step: 0.001,
                label: "Threshold"
            } )


            bloomFolder.addBinding( this.bloomPass.luminanceMaterial, "smoothing", {
                min: 0,
                max: 1,
                step: 0.001,
                label: "Smoothing"
            } )



            const bokehFolder = postProcessFolder.addFolder( {
                title: 'BokehPass', expanded: true
            } );

            bokehFolder.addBinding( this.params, "resolution", {
                label: "Resolution",
                options: {
                    240: 240,
                    360: 360,
                    480: 480,
                    720: 720,
                    1080: 1000
                }
            }).on( 'change', (e) => {
                this.depthOfFieldEffect.resolution.height = e.value;
            })

            bokehFolder.addBinding( this.depthOfFieldEffect, "bokehScale", {
                min: 1.0,
                max: 6.0,
                step: 0.001,
                label: "Bokeh Scale"
            } )


            bokehFolder.addBinding( this.depthOfFieldEffect.blurPass, "kernelSize", {
                label: "Edge Blur Kernel",
                options: KernelSize
            } )

            bokehFolder.addBinding( this.cocMaterial.uniforms.focusDistance, "value", {
                min: 0.0,
                max: 1.0,
                step: 0.001,
                label: "Focus"
            } )

            bokehFolder.addBinding( this.cocMaterial.uniforms.focusRange, "value", {
                min: 0.0,
                max: 1.0,
                step: 0.0001,
                label: "Focus Length"
            })


            // const matChanger = ( ) => {
            //
            //     this.bokehPass.uniforms[ 'focus' ].value = this.state.bokeh.focus;
            //     this.bokehPass.uniforms[ 'aperture' ].value = this.state.bokeh.aperture * 0.00001;
            //     this.bokehPass.uniforms[ 'maxblur' ].value = this.state.bokeh.maxblur;
            //
            // };
            //
            // bokehFolder.add( this.state.bokeh, 'enabled' ).name( 'Enabled' )
            //     .onChange( () => {
            //         this.bokehPass.enabled = this.state.bokeh.enabled
            //     } );
            //
            // bokehFolder.add( this.state.bokeh, 'focus', 0, 300 ).step( 0.001 )
            //     .onChange( matChanger );
            //
            // bokehFolder.add( this.state.bokeh, 'aperture', 0, 10 ).step( 0.1 )
            //     .onChange( matChanger );
            //
            // bokehFolder.add( this.state.bokeh, 'maxblur', 0, 0.09 ).step( 0.001 )
            //     .onChange( matChanger );


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
            this.scene.traverse( this.materials._darkenNonBloomed )
            this.bloomComposer.render()
            this.scene.traverse( this.materials._restoreMaterial )
        }

    }

    productionRender() {
        if ( this.state.postprocessing ) {
            this.composer.render()
        } else {
            this.renderer.render( this.scene, this.camera )
        }
    }

    debugRender() {
        if ( this.state.postprocessing ) {
            //this.bloomRender()

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
