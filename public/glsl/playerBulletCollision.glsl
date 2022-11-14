collision = 0.0;

for(int i = 0; i < MAX_ACTIVE_ENEIMIES; i ++){
    int offset = i * 3;
    vec3 enemyPosition = vec3(enemyPositions[offset], enemyPositions[offset + 1], enemyPositions[offset + 2]);
    float enemyBulletDistance = distance(position, enemyPosition);
    float close = float(enemyBulletDistance < enemyRadii[i]);
    collision = max(collision, close * (float(MAX_ACTIVE_ENEIMIES) + float(i)));
}


//Bullet exists in scene?
collision = collision * float(position.y > -500.);
vec3 collisionPosition = collision > 0. ? position : vec3(0.0);

gl_FragColor = vec4(collisionPosition, collision);