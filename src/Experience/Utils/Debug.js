import * as THREE from 'three'
import Stats from 'stats.js'
import { Pane } from 'tweakpane';
import Experience from "../Experience.js";
import Sizes from "./Sizes.js";

export default class Debug {

    static _instance = null

    static getInstance() {
        return Debug._instance || new Debug()
    }

    experience = Experience.getInstance()
    sizes = Sizes.getInstance()

    constructor() {
        // Singleton
        if ( Debug._instance ) {
            return Debug._instance
        }
        Debug._instance = this

        //this.active = window.location.hash === '#debug'
        this.active = true

        if ( this.active ) {
            this.panel = new Pane({
                title: 'Debug',
                container: document.getElementById('debug-panel'),
            });

            this.stats = new Stats()
            this.stats.showPanel( 0 );

            document.body.appendChild( this.stats.dom )
        }
    }

    createDebugTexture( texture ) {
        this.debugTexture = texture;
        this.cameraOrtho = new THREE.OrthographicCamera( -this.sizes.width / 2, this.sizes.width / 2, this.sizes.height / 2, -this.sizes.height / 2, 1, 10 );
        this.cameraOrtho.position.z = 10;

        this.sceneOrtho = new THREE.Scene();

        const material = new THREE.SpriteMaterial( {
            map: texture,
            //blending: THREE.NoBlending
        } );

        const width = 128;
        const height = 128;

        //const width = material.map.image.width;
        //const height = material.map.image.height;

        this.sprite = new THREE.Sprite( material );
        this.sprite.center.set( 0.0, 0.0 );
        this.sprite.scale.set( width, height, 1 );
        this.sceneOrtho.add( this.sprite );

        this.updateSprite();
    }

    updateSprite() {
        if ( !this.debugTexture ) return;

        this.cameraOrtho.left = -this.sizes.width / 2;
        this.cameraOrtho.right = this.sizes.width / 2;
        this.cameraOrtho.top = this.sizes.height / 2;
        this.cameraOrtho.bottom = -this.sizes.height / 2;
        this.cameraOrtho.updateProjectionMatrix();

        const width = this.sizes.width / 2;
        const height = this.sizes.height / 2;

        this.sprite.position.set( -width, -height, 1 ); // bottom left
    }

    resize() {
        this.updateSprite();
    }

    update( deltaTime ) {
        if ( this.debugTexture ) {
            //this.experience?.renderer.instance.render( this.sceneOrtho, this.cameraOrtho );
        }
    }
}
