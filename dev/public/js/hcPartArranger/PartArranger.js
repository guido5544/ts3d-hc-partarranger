import anime from './anime.es.js';
import Quaternion from './quaternion.min.js';


export class PartArranger {

    constructor(viewer) {
        this._viewer = viewer;

        this._mbounds = null;
        this.nodeHash = [];
        this._animations = [];
        
        this._animationDuration = 2000;
        this._animationDelayDuration = 3000;

        this._relativeScale = false;
        this._scaleFactor = 0.04;
        this._stackInPlace = false;
    
    }

    setAnimationDuration(duration) {
        this._animationDuration = duration;
    }

    setAnimationDelayDuration(duration) {
        this._animationDelayDuration = duration;
    }

    setRelativeScale(onoff) {
        this._relativeScale = onoff;
    }
    
    setScaleFactor(scale) {
        this._scaleFactor = scale;
    }

    setStackInPlace(onoff) {
        this._stackInPlace = onoff;
    }

    reset() {
        this._viewer.model.resetNodesTransform();
        this.nodeHash = [];
        this._mbounds = [];
    }

    async arrangeBodies(revert) {

        let leafArray = [];

        let r = this._viewer.selectionManager.getResults();
        if (r.length == 0) {
            r.push(new Communicator.Selection.SelectionItem(this._viewer.model.getRootNode()));
        }
        for (let n = 0; n < r.length; n++) {
            let rootNode = r[n].getNodeId();
            let ident = new Communicator.Matrix();
            ident.loadIdentity();


            let leafarraypromises = [];
            let leafnodeids = [];
            await this._gatherLeavesAndClearMats(rootNode, leafarraypromises, leafnodeids);

            let values = await Promise.all(leafarraypromises);

            let turnoff = [];

            for (let i = 0; i < values.length; i++) {
                let meshids = values[i];
                let node = leafnodeids[i];
                if (meshids == null || meshids == undefined || meshids.length == 0) {
                    turnoff.push(node);
                }
                else if (leafArray[meshids[0][1]] != undefined) {
                    leafArray[meshids[0][1]].push({ nodeid: node });
                }
                else {
                    try {
                        let meshdata = await this._viewer.model.getNodeMeshData(node);
                        leafArray[meshids[0][1]] = [];
                        leafArray[meshids[0][1]].push({ nodeid: node });
                    } catch (error) {
                    }

                }
            }
        }

        let items = [];
        for (let i in leafArray)
            items.push(leafArray[i]);

        items.sort(function (a, b) {
            if (a.length > b.length) {
                return -1;
            }
            else if (a.length < b.length) {
                return 1;
            }
            return 0;
        });

        if (revert != undefined || revert == true)
            this.revert(items);
        else
            this.arrange(items);

    }

    async arrangeFromSelection(revert) {
            let r = this._viewer.selectionManager.getResults();
            let nodeids = [];

            let namehash = [];
            for (let i = 0; i < r.length; i++) {
                let nodeid = r[i].getNodeId();
                let name = this._viewer.model.getNodeName(nodeid);
                 if (namehash[name] != undefined) {
                    namehash[name].push({ nodeid: nodeid});
                }
                else {
                    namehash[name] = [];
                    namehash[name].push({ nodeid: nodeid});

                }
            }

            let items = [];
            for (let i in namehash)
                items.push(namehash[i]);

            items.sort(function (a, b) {
                if (a.length > b.length) {
                    return -1;
                }
                else if (a.length < b.length) {
                    return 1;
                }
                return 0;
            });                


        if (revert != undefined || revert == true)
            this.revert(items);
        else
            this.arrange(items);
        
    }

    async arrangeFromSelectionChildren(revert) {
        let nodeid = this._viewer.selectionManager.getLast().getNodeId();
        let children = this._viewer.model.getNodeChildren(nodeid);

        let namehash = [];
        for (let i = 0; i < children.length; i++) {
            let nodeid = children[i];
            let name = this._viewer.model.getNodeName(nodeid);
             if (namehash[name] != undefined) {
                namehash[name].push({ nodeid: nodeid});
            }
            else {
                namehash[name] = [];
                namehash[name].push({ nodeid: nodeid});

            }
        }
        let items = [];
        for (let i in namehash)
            items.push(namehash[i]);

        items.sort(function (a, b) {
            if (a.length > b.length) {
                return -1;
            }
            else if (a.length < b.length) {
                return 1;
            }
            return 0;
        });


        if (revert != undefined || revert == true)
            this.revert(items);
        else
            this.arrange(items);

    }

    async revert(itemsin) {

        let items;
        let allitems = [];

        if (itemsin == undefined || itemsin == null) {
            items = [];
            for (let i in this.nodeHash) {
                items.push([{ nodeid: parseInt(i) }]);
            }
        }
        else
            items = itemsin;

        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items[i].length; j++) {
                let mat = Communicator.Matrix.inverse(this._viewer.model.getNodeNetMatrix(this._viewer.model.getNodeParent(items[i][j].nodeid)));
                if (this.nodeHash[items[i][j].nodeid] != undefined) {
                    items[i][j].origmatNet = this._viewer.model.getNodeNetMatrix(items[i][j].nodeid).copy();
                    items[i][j].origmat = this._viewer.model.getNodeMatrix(items[i][j].nodeid).copy();
                    items[i][j].parentinverse = mat;

                    allitems.push(items[i][j]);
                    let tm = new Communicator.Matrix();
                    let em = this.nodeHash[items[i][j].nodeid];

                    items[i][j].endmatrix = em;
                    delete this.nodeHash[items[i][j].nodeid];
                }
            }
        }

        this._startAnimation(allitems);
    }

    async _getObjectBounding(nodeid) {
        let bounds = await this._viewer.model.getNodesBounding([nodeid]);
        
        let matrix = Communicator.Matrix.inverse(this._viewer.model.getNodeNetMatrix(nodeid));
        let boxcorners = bounds.getCorners();
        let boxtransformed = [];
        matrix.transformArray(boxcorners, boxtransformed);

        let outbounds = new Communicator.Box();
        outbounds.min = boxtransformed[0].copy();
        outbounds.max = boxtransformed[0].copy();
        
        for (let i=1;i<boxtransformed.length;i++)
        {
            outbounds.addPoint(boxtransformed[i]);
        }
        
        return outbounds;
    }


    async arrange(items) {

        let upVector = this._viewer.model.getViewAxes().upVector;
        let lsproms = [];
        let lsleafs = [];
        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items[i].length; j++) {
                let mat = Communicator.Matrix.inverse(this._viewer.model.getNodeNetMatrix(this._viewer.model.getNodeParent(items[i][j].nodeid)));
                items[i][j].origmatNet = this._viewer.model.getNodeNetMatrix(items[i][j].nodeid);
                items[i][j].origmat = this._viewer.model.getNodeMatrix(items[i][j].nodeid);
                items[i][j].parentinverse = mat;
                if (this.nodeHash[items[i][j].nodeid] == undefined) {
                    this.nodeHash[items[i][j].nodeid] = items[i][j].origmatNet.copy();
                }
            }
        }

        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items[i].length; j++) {

                lsproms.push(this._getObjectBounding(items[i][j].nodeid));
                lsleafs.push(items[i][j]);
            }
        }

        let values = await Promise.all(lsproms);

        for (let i = 0; i < values.length; i++) {
            lsleafs[i].bounding = values[i];
            lsleafs[i].diag = lsleafs[i].bounding.extents().length();
        }

        let maxextents = 0;
        for (let i = 0; i < items.length; i++) {
            if (items[i][0].bounding && items[i][0].bounding.extents().length() > maxextents) {
                maxextents = items[i][0].bounding.extents().length();
            }
        }

        let l = Math.ceil(Math.sqrt(items.length));
    
        let bounds = await this._viewer.model.getModelBounding(true, false, false);
        if (!this._mbounds)
            this._mbounds = bounds;


        let mbextents = this._mbounds.extents().length() * this._scaleFactor;

        let scalemat = new Communicator.Matrix();
        scalemat.setScaleComponent(mbextents, mbextents, mbextents);
        let transmat = new Communicator.Matrix();
        if (this._stackInPlace) {
            if (upVector.z > 0) {
                transmat.setTranslationComponent(0, (bounds.min.y + bounds.max.y) / 2,  (bounds.min.z + bounds.max.z) / 2);
            }
            else
            {
                transmat.setTranslationComponent(  (bounds.min.x + bounds.max.x) / 2, (bounds.min.y + bounds.max.y) / 2, 0);
    
            }
        }
        else {
            if (upVector.z > 0) {
                transmat.setTranslationComponent(0, bounds.min.y - l * mbextents * 1.1, this._mbounds.min.z);
            }
            else
            {
                transmat.setTranslationComponent( bounds.min.x - l * mbextents * 1.1,this._mbounds.min.y, 0);
    
            }
        }
        let extramat = Communicator.Matrix.multiply(scalemat, transmat);

        let animleafs = [];

        let j = 0;
        for (let x = 0; x < l; x++) {
            for (let y = 0; y < l; y++) {
                let leaf = items[j][0];
                let leafarray = items[j];
                j++;
                let m = new Communicator.Matrix();
                m.loadIdentity();

                let bb = leaf.bounding;
                if (!bb)
                    continue;

                for (let z = 0; z < leafarray.length; z++) {
                    let cleaf = leafarray[z];
                    let bb = cleaf.bounding;
                    if (!bb)
                        continue;

                    let extents = bb.extents();
                    m.setTranslationComponent(-bb.center().x, -bb.center().y, -bb.center().z);
                    let mscale = new Communicator.Matrix();
                    let extendsdiv;
                    if (!this._relativeScale)
                        extendsdiv = extents.length();
                    else
                        extendsdiv = maxextents;
                    mscale.setScaleComponent(1 / extendsdiv, 1 / extendsdiv, 1 / extendsdiv);

                    let resmatrix = Communicator.Matrix.multiply(m, mscale);

                    let mtrans = new Communicator.Matrix();
                    if (upVector.z > 0) {
                        mtrans.setTranslationComponent(x, y, z);
                    }
                    else {
                        mtrans.setTranslationComponent(x, z, y);
                    }

                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix, mtrans);
                    let resmatrix2b = Communicator.Matrix.multiply(resmatrix2, extramat);
                    let resmatrix3 = Communicator.Matrix.multiply(resmatrix2b, cleaf.parentinverse);
                    cleaf.endmatrix2 = resmatrix3;
                    cleaf.endmatrix = resmatrix2b;

                    animleafs.push(cleaf);
                }


                if (j >= items.length)
                    break;
            }
            if (j >= items.length)
                break;
        }

        this._startAnimation(animleafs);

    }

    async _gatherLeavesAndClearMats(node, leafpromises, leafnodeids) {
        let children = this._viewer.model.getNodeChildren(node);
        if (children.length == 0) {
            leafpromises.push(this._viewer.model.getMeshIds([node]));
            leafnodeids.push(node);

        }
        for (let i = 0; i < children.length; i++) {
            await this._gatherLeavesAndClearMats(children[i], leafpromises, leafnodeids);
        }
    }

    _startAnimation(items) {

        let _this = this;
        for (let i = 0; i < items.length; i++) {
            setTimeout(function () {
                let animation = new PartArrangerAnim(items[i], _this._animationDuration);
                _this._animations.push(animation);
            }, i * Math.floor(1 / items.length * this._animationDelayDuration));
        }

        setTimeout(function () {
            window.requestAnimationFrame(function (t) { _this._doAnimation(t); });
        }, 100);
    }

    _doAnimation(timestamp) {

        if (this._animations.length > 0) {

            for (let i = 0; i < this._animations.length; i++) {
                this._animations[i].update(timestamp, this._viewer);
                if (this._animations[i]._done) {
                    this._animations.splice(i, 1);
                    i--;
                }
            }
            let _this = this;
            window.requestAnimationFrame(function (t) { _this._doAnimation(t); });
        }
    }
}

class PartArrangerAnim
{    
    constructor(leaf, duration) {
        
        this._value  = "0";
        this._leaf = leaf;
        this._done = false;     

        this._startpos = new Communicator.Point3(leaf.origmatNet.m[12], leaf.origmatNet.m[13], leaf.origmatNet.m[14]);
        let endpos = new Communicator.Point3(leaf.endmatrix.m[12], leaf.endmatrix.m[13], leaf.endmatrix.m[14]);
        this._delta = Communicator.Point3.subtract(endpos, this._startpos).normalize();
        this._deltalength = Communicator.Point3.subtract(endpos, this._startpos).length();

        let startquat = Communicator.Quaternion.createFromMatrix(leaf.origmatNet);
        let endquat = Communicator.Quaternion.createFromMatrix(leaf.endmatrix);
        this._startscale = new Communicator.Point3(leaf.origmatNet.m[0], leaf.origmatNet.m[1], leaf.origmatNet.m[2]).length();
        this._endscale = new Communicator.Point3(leaf.endmatrix.m[0], leaf.endmatrix.m[1], leaf.endmatrix.m[2]).length();


        let q1 = Quaternion( startquat.w,  startquat.x,  startquat.y, startquat.z);
        let q2 = Quaternion( endquat.w, endquat.x, endquat.y, endquat.z);
        
        this._slerp = q1.slerp(q2);

        let animedef = {
            duration: duration.toString(),
            easing: "easeInOutQuad",
            _value: "100",
        };


        animedef.targets = this;
        animedef.autoplay = false;
        let _this = this;

        animedef.complete = function () {
            _this._anime.remove();
            _this._done = true;
        };
        this._anime = anime(animedef);
    }

    update(timestamp, viewer) {        

        this._anime.tick(timestamp);
        let v = this._value / 100.0;
       
        let currentpos = Communicator.Point3.add(this._startpos, Communicator.Point3.scale(this._delta, v*this._deltalength));
        
        let cq = this._slerp(v);
        let cquat = new Communicator.Quaternion(cq.x,cq.y,cq.z,cq.w);
        
        let qmat2 = Communicator.Quaternion.toMatrix(cquat);

        let transmat = new Communicator.Matrix();
        transmat.setTranslationComponent(currentpos.x, currentpos.y, currentpos.z);

        let scale = this._startscale + (this._endscale - this._startscale) * v;
        let scalemat = new Communicator.Matrix();
        scalemat.setScaleComponent(scale, scale, scale);

        let qmat = Communicator.Matrix.multiply(scalemat,qmat2);

        let resmatrix = Communicator.Matrix.multiply(qmat, transmat);
        let resmatrix2 = Communicator.Matrix.multiply(resmatrix, this._leaf.parentinverse);

        if (v>=1)
        {
            resmatrix2 = Communicator.Matrix.multiply(this._leaf.endmatrix, this._leaf.parentinverse);
        }
        viewer.model.setNodeMatrix(this._leaf.nodeid,resmatrix2);

    }

}