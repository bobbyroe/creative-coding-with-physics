import * as THREE from "three";

function getBody(RAPIER, world, model) {
    const size = 1.0;
    const colliderSize = size * 0.5;
    const range = 6;
    const density = size  * 1;
    const startPos = model.position.clone();
    let { x, y, z } = model.position;

    // RIGID BODY
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z)
            .setLinearDamping(0.5)
            // .setAngularDamping(2);
    let rigid = world.createRigidBody(rigidBodyDesc);
    let colliderDesc = RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density);
    world.createCollider(colliderDesc, rigid);

    const mesh = model.clone();
    // mesh.scale.setScalar(size);
    
    function update () {
      rigid.resetForces(true); 
      let { x, y, z } = rigid.translation();
      let pos = new THREE.Vector3(x, y, z);
      let dir = pos.clone().sub(startPos).normalize();
      mesh.position.copy(pos);
      let q = rigid.rotation();
      let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
      // mesh.rotation.setFromQuaternion(rote);
      rigid.addForce(dir.multiplyScalar(-10), true);
    }
    return { mesh, rigid, update };
  }

  function getMouseBall (RAPIER, world) {
    const mouseSize = 0.5;
    const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
    });
    const mouseLight = new THREE.PointLight(0xffffff, 1);
    const mouseMesh = new THREE.Mesh(geometry, material);
    mouseMesh.add(mouseLight);

    // RIGID BODY
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
    let mouseRigid = world.createRigidBody(bodyDesc);
    let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 8.0);
    world.createCollider(dynamicCollider, mouseRigid);
    function update (mousePos) {
      mouseRigid.setTranslation({ x: mousePos.x, y: mousePos.y + 0.5, z: mousePos.z });
      let { x, y, z } = mouseRigid.translation();
      mouseMesh.position.set(x, y, z);
    }
    return { mesh: mouseMesh, update };
  }

  export { getBody, getMouseBall };