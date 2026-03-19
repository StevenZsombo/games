var univ = {
    isOnline: false,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameMoreStr: "(English name + homeroom)"
}



class Game extends GameCore {
    //#region more
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                             customize here                                                   ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                                                                              ///
    ///         these are called  when appropriate                                                                   ///
    ///                                                                                                              ///
    ///         initialize_more                                                                                      ///                                   
    ///         draw_more                                                                                            ///
    ///         update_more                                                                                          ///
    ///         next_loop_more                                                                                       ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                             INITIALIZE                                                       ///
    /// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#endregion


    //#region initialize_more
    initialize_more() {
        const b = new Button()

        window.b = b
        this.add_drawable(b)

        b.img = cropper.secondCanvas
        const img = cropper.load_img("conquest/test.bmp", (img) => {
            cropper.secondCanvas.width = img.width
            cropper.secondCanvas.height = img.height
            cropper.ctx.drawImage(img, 0, 0)
            b.resizeToMatchImageSize()
            b.x = 0
            b.y = 0
            after()
        })

        b.on_click = function ({ x, y }) {
            x -= b.x
            console.log(b.x)
            y -= b.y
            console.log(x)
            let sf = b.img.width / b.width;
            console.log({ sf })
            x *= sf;
            console.log(x)
            y *= sf;
            cropper.floodFill(x, y, [MM.randomInt(0, 255), MM.randomInt(0, 255), MM.randomInt(0, 255)]); console.log("ok")
        }


        const j = {
            "province_count": 61,
            "image_file": "fictional_provinces_bw.bmp",
            "provinces": [
                {
                    "id": 1,
                    "name": "Alderreach",
                    "coordinate": {
                        "x": 919,
                        "y": 156
                    }
                },
                {
                    "id": 2,
                    "name": "Ashmere",
                    "coordinate": {
                        "x": 176,
                        "y": 165
                    }
                },
                {
                    "id": 3,
                    "name": "Briarfen",
                    "coordinate": {
                        "x": 988,
                        "y": 166
                    }
                },
                {
                    "id": 4,
                    "name": "Brindle",
                    "coordinate": {
                        "x": 717,
                        "y": 176
                    }
                },
                {
                    "id": 5,
                    "name": "Caelmoor",
                    "coordinate": {
                        "x": 349,
                        "y": 187
                    }
                },
                {
                    "id": 6,
                    "name": "Cindervale",
                    "coordinate": {
                        "x": 107,
                        "y": 183
                    }
                },
                {
                    "id": 7,
                    "name": "Corwyn",
                    "coordinate": {
                        "x": 646,
                        "y": 189
                    }
                },
                {
                    "id": 8,
                    "name": "Dawnmere",
                    "coordinate": {
                        "x": 495,
                        "y": 191
                    }
                },
                {
                    "id": 9,
                    "name": "Dunhollow",
                    "coordinate": {
                        "x": 790,
                        "y": 209
                    }
                },
                {
                    "id": 10,
                    "name": "Eldenwatch",
                    "coordinate": {
                        "x": 441,
                        "y": 199
                    }
                },
                {
                    "id": 11,
                    "name": "Emberfall",
                    "coordinate": {
                        "x": 289,
                        "y": 221
                    }
                },
                {
                    "id": 12,
                    "name": "Fairharbor",
                    "coordinate": {
                        "x": 153,
                        "y": 219
                    }
                },
                {
                    "id": 13,
                    "name": "Frostmere",
                    "coordinate": {
                        "x": 953,
                        "y": 220
                    }
                },
                {
                    "id": 14,
                    "name": "Glenward",
                    "coordinate": {
                        "x": 1044,
                        "y": 227
                    }
                },
                {
                    "id": 15,
                    "name": "Goldmarsh",
                    "coordinate": {
                        "x": 379,
                        "y": 246
                    }
                },
                {
                    "id": 16,
                    "name": "Grayhaven",
                    "coordinate": {
                        "x": 96,
                        "y": 244
                    }
                },
                {
                    "id": 17,
                    "name": "Greenholt",
                    "coordinate": {
                        "x": 697,
                        "y": 253
                    }
                },
                {
                    "id": 18,
                    "name": "Highvale",
                    "coordinate": {
                        "x": 852,
                        "y": 251
                    }
                },
                {
                    "id": 19,
                    "name": "Ironmere",
                    "coordinate": {
                        "x": 587,
                        "y": 248
                    }
                },
                {
                    "id": 20,
                    "name": "Juniper",
                    "coordinate": {
                        "x": 490,
                        "y": 248
                    }
                },
                {
                    "id": 21,
                    "name": "Kestrel",
                    "coordinate": {
                        "x": 238,
                        "y": 268
                    }
                },
                {
                    "id": 22,
                    "name": "Kingshade",
                    "coordinate": {
                        "x": 431,
                        "y": 288
                    }
                },
                {
                    "id": 23,
                    "name": "Larkspur",
                    "coordinate": {
                        "x": 775,
                        "y": 293
                    }
                },
                {
                    "id": 24,
                    "name": "Lowfen",
                    "coordinate": {
                        "x": 339,
                        "y": 305
                    }
                },
                {
                    "id": 25,
                    "name": "Marrowind",
                    "coordinate": {
                        "x": 662,
                        "y": 311
                    }
                },
                {
                    "id": 26,
                    "name": "Moonmere",
                    "coordinate": {
                        "x": 599,
                        "y": 308
                    }
                },
                {
                    "id": 27,
                    "name": "Northpass",
                    "coordinate": {
                        "x": 835,
                        "y": 317
                    }
                },
                {
                    "id": 28,
                    "name": "Oakrest",
                    "coordinate": {
                        "x": 529,
                        "y": 319
                    }
                },
                {
                    "id": 29,
                    "name": "Palehaven",
                    "coordinate": {
                        "x": 220,
                        "y": 330
                    }
                },
                {
                    "id": 30,
                    "name": "Pinewatch",
                    "coordinate": {
                        "x": 390,
                        "y": 349
                    }
                },
                {
                    "id": 31,
                    "name": "Queenshollow",
                    "coordinate": {
                        "x": 715,
                        "y": 360
                    }
                },
                {
                    "id": 32,
                    "name": "Rainmere",
                    "coordinate": {
                        "x": 299,
                        "y": 374
                    }
                },
                {
                    "id": 33,
                    "name": "Redfield",
                    "coordinate": {
                        "x": 565,
                        "y": 374
                    }
                },
                {
                    "id": 34,
                    "name": "Rimeford",
                    "coordinate": {
                        "x": 780,
                        "y": 370
                    }
                },
                {
                    "id": 35,
                    "name": "Riverwake",
                    "coordinate": {
                        "x": 891,
                        "y": 373
                    }
                },
                {
                    "id": 36,
                    "name": "Rosefen",
                    "coordinate": {
                        "x": 472,
                        "y": 378
                    }
                },
                {
                    "id": 37,
                    "name": "Sablemoor",
                    "coordinate": {
                        "x": 638,
                        "y": 379
                    }
                },
                {
                    "id": 38,
                    "name": "Seabrook",
                    "coordinate": {
                        "x": 224,
                        "y": 405
                    }
                },
                {
                    "id": 39,
                    "name": "Silverden",
                    "coordinate": {
                        "x": 390,
                        "y": 413
                    }
                },
                {
                    "id": 40,
                    "name": "Southwatch",
                    "coordinate": {
                        "x": 814,
                        "y": 426
                    }
                },
                {
                    "id": 41,
                    "name": "Stonemere",
                    "coordinate": {
                        "x": 524,
                        "y": 431
                    }
                },
                {
                    "id": 42,
                    "name": "Sunreach",
                    "coordinate": {
                        "x": 744,
                        "y": 434
                    }
                },
                {
                    "id": 43,
                    "name": "Thornfield",
                    "coordinate": {
                        "x": 609,
                        "y": 440
                    }
                },
                {
                    "id": 44,
                    "name": "Timberrun",
                    "coordinate": {
                        "x": 319,
                        "y": 442
                    }
                },
                {
                    "id": 45,
                    "name": "Umberfall",
                    "coordinate": {
                        "x": 452,
                        "y": 453
                    }
                },
                {
                    "id": 46,
                    "name": "Valecrest",
                    "coordinate": {
                        "x": 988,
                        "y": 448
                    }
                },
                {
                    "id": 47,
                    "name": "Westmere",
                    "coordinate": {
                        "x": 1038,
                        "y": 474
                    }
                },
                {
                    "id": 48,
                    "name": "Whitebarrow",
                    "coordinate": {
                        "x": 797,
                        "y": 486
                    }
                },
                {
                    "id": 49,
                    "name": "Wildmere",
                    "coordinate": {
                        "x": 381,
                        "y": 479
                    }
                },
                {
                    "id": 50,
                    "name": "Windrest",
                    "coordinate": {
                        "x": 933,
                        "y": 484
                    }
                },
                {
                    "id": 51,
                    "name": "Wolfden",
                    "coordinate": {
                        "x": 696,
                        "y": 488
                    }
                },
                {
                    "id": 52,
                    "name": "Yarrow",
                    "coordinate": {
                        "x": 526,
                        "y": 496
                    }
                },
                {
                    "id": 53,
                    "name": "Zephyr Vale",
                    "coordinate": {
                        "x": 154,
                        "y": 494
                    }
                },
                {
                    "id": 54,
                    "name": "Blackharbor",
                    "coordinate": {
                        "x": 625,
                        "y": 501
                    }
                },
                {
                    "id": 55,
                    "name": "Copperfen",
                    "coordinate": {
                        "x": 234,
                        "y": 522
                    }
                },
                {
                    "id": 56,
                    "name": "Dragonmere",
                    "coordinate": {
                        "x": 1004,
                        "y": 528
                    }
                },
                {
                    "id": 57,
                    "name": "Eastcliff",
                    "coordinate": {
                        "x": 445,
                        "y": 531
                    }
                },
                {
                    "id": 58,
                    "name": "Foxhollow",
                    "coordinate": {
                        "x": 143,
                        "y": 547
                    }
                },
                {
                    "id": 59,
                    "name": "Hartmoor",
                    "coordinate": {
                        "x": 874,
                        "y": 548
                    }
                },
                {
                    "id": 60,
                    "name": "Mistwood",
                    "coordinate": {
                        "x": 273,
                        "y": 553
                    }
                },
                {
                    "id": 61,
                    "name": "Starfen",
                    "coordinate": {
                        "x": 203,
                        "y": 577
                    }
                }
            ]
        }

        window.j = j

        const after = () => {
            Object.values(j.provinces).forEach(p => {
                const lab = new Button({
                    transparent: true,
                    txt: p.name,
                    fontSize: 18
                })
                lab.centeratX(p.coordinate.x)
                lab.centeratY(p.coordinate.y)
                cropper.floodFill(
                    p.coordinate.x, p.coordinate.y, [MM.randomInt(0, 255), MM.randomInt(0, 255), MM.randomInt(0, 255)]
                )
                this.add_drawable(lab)
            })
        }
    }

    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {








    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more

    draw_more(screen) {







    }
    //#endregion
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region next_loop_more
    next_loop_more() {




    }//#endregion
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////




} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {


}/// end of dev
