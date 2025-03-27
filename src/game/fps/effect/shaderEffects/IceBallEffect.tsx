import { Color, Vector2 } from 'three';
import { AdditiveBlending } from 'three';
import { ShaderEffect } from '@/game/fps/effect/ShaderEffect';
import { Vector3 } from 'three';

export const IceBallEffect: React.FC<{
  position: Vector3;
  scale?: Vector3;
  normal?: Vector3;
  disableBillboard?: boolean;
  volume?: boolean;
}> = ({ position, scale, normal, disableBillboard = false, volume = true }) => {
  // 얼음 효과를 위한 커스텀 프래그먼트 셰이더
  const iceFragmentShader = /* glsl */ ` 
    uniform vec2 resolution;
    uniform float time;
    uniform float opacity;
    varying vec2 vUv;

    const float MIN_DIST = 0.001;
    const float MAX_DIST = 1.0;
    const int MAX_ITER = 64;
    const float IOR = 1.25;
    const float ABB = 0.025;
    const float DENSITY = 0.05;

    #define pi 3.1415926535
    #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
    #define sat(a) clamp(a,0.0,1.0)
    #define h13(n) fract((n)*vec3(12.9898,78.233,45.6114)*43758.5453123)

    vec2 vor(vec2 v, vec3 p, vec3 s){
        p = abs(fract(p-s)-0.5);
        float a = max(p.x,max(p.y,p.z));
        float b = min(v.x,a);
        float c = max(v.x,min(v.y,a));
        return vec2(b,c);
    }

    float vorMap(vec3 p){
        vec2 v = vec2(5.0);
        v = vor(v,p,h13(0.96));
        p.xy*=rot(1.2);
        v = vor(v,p,h13(0.55));
        p.yz*=rot(2.);
        v = vor(v,p,h13(0.718));
        p.zx*=rot(2.7);
        v = vor(v,p,h13(0.3));
        return v.y-v.x; 
    }

    float sd_box(vec3 p){
        p=abs(p)-.2;
        return length(max(p,0.)) + min(max(p.x,max(p.y,p.z)),0.);
    }

    vec3 cameraDir(vec2 uv, float ratio, vec3 p, vec3 dir){
        uv -= .5;
        uv.x *= ratio;
        vec3 r = cross(vec3(0., 1., 0.), dir);
        vec3 u = cross(dir, r);
        float zoom = 1.;
        vec3 c = p + dir * zoom;
        vec3 i = c+uv.x*r + uv.y*u;
        vec3 rd = i - p;
        return normalize(rd);
    }

    float map(in vec3 p)
    {
        // GEM
        float cracks = -vorMap(p*3.)-0.05;
        float gem = length(p)-.25;
        float cracked_gem = mix(gem,cracks,.05);
        
        return cracked_gem;
    }

    float raymarch(vec3 ro, vec3 rd, float s, out int i)
    {
        float t = 0.0;
        
        for(i = 0; i < MAX_ITER; i++){
            vec3 pos = ro + t*rd;
            float d = map(pos)*s;
            if(abs(d) < MIN_DIST)
                break;
            t += d;
            if(t > MAX_DIST) break;
        }
        
        if(t > MAX_DIST)
            t = -1.;
        return t;
    }

    vec3 calcNormal(in vec3 pos)
    {
        vec2 e = vec2(MIN_DIST, 0.);
        float d = map(pos);
        return normalize(d - vec3(map(pos-e.xyy),
                              map(pos-e.yxy),
                              map(pos-e.yyx)));
    }

    // 환경 맵 샘플링 함수 - cubemap이 없는 경우 대체 색상 생성
    vec4 sampleEnvMap(vec3 dir) {
        // 간단한 그라데이션 배경 생성
        float y = dir.y * 0.5 + 0.5;
        vec3 color = mix(vec3(0.1, 0.2, 0.4), vec3(0.5, 0.7, 1.0), y);
        
        // 빛나는 점들(별) 추가
        vec3 d = normalize(dir);
        float stars = pow(max(0.0, vorMap(d*50.0)+0.5), 15.0) * 0.5;
        color += vec3(stars);
        
        return vec4(color, 1.0);
    }

    void main()
    {
        float t = time;
        vec2 uv = vUv;
        float ratio = resolution.x/resolution.y;
        
        // 회전하는 카메라 효과
        vec3 ro = vec3(0.8*sin(t*0.2), 0.01*cos(t*0.25), -0.8*cos(t*0.2));
        vec3 f = normalize(-ro);
        vec3 truePos = ro + f*(sin(t*15.)+1.0);
        vec3 rd = cameraDir(uv, ratio, truePos, f);
        
        vec3 col = vec3(0.0);
        int steps;
        float d = raymarch(ro, rd, 1.0, steps);
        
        if(d > 0.0)
        {
            int internal_steps;
            vec3 p = ro + rd*d;
            vec3 n = calcNormal(p);
            float fresnel = pow(1.0+dot(rd,n), 5.0);
            vec3 refl = reflect(rd,n);
            vec3 reflTex = sampleEnvMap(refl).rgb;
            rd = refract(rd,n,1.0/IOR);
            p += -n * MIN_DIST * 3.0;
            d = raymarch(p,rd,-1.0, internal_steps);
            p += rd*d;
            n = -calcNormal(p);
            vec3 _rd = rd;
            
            // red
            vec3 refr = refract(_rd,n, IOR-ABB);
            if(dot(refr,refr) == 0.0)
                rd = reflect(_rd,n);
            else
                rd = refr;
            col.r = sampleEnvMap(rd).r;
            
            // green
            refr = refract(_rd,n,IOR);
            if(dot(refr,refr) == 0.0)
                rd = reflect(_rd,n);
            else
                rd = refr;
                
            col.g = sampleEnvMap(rd+vec3(ABB)).g;
            
            // blue
            refr = refract(_rd,n,IOR);
            if(dot(refr,refr) == 0.0)
                rd = reflect(_rd,n);
            else
                rd = refr;
            col.b = sampleEnvMap(rd).b;
            
            float optDist = exp(DENSITY * -d);
            
            col *= optDist;
            col += reflTex * (1.0-fresnel);
            col += float(internal_steps)/200.0*(1.0-fresnel);
        }
        else {
            col = sampleEnvMap(rd).rgb;
        }
        
        col += float(steps)/200.0;
        
        // 시간 기반 투명도 애니메이션
        float timeBasedOpacity = 0.0;
        if (time < 0.5) {
            // 페이드 인 (0초 ~ 0.5초)
            timeBasedOpacity = smoothstep(0.0, 0.5, time);
        } else if (time < 1.5) {
            // 완전 불투명 구간 (0.5초 ~ 1.5초)
            timeBasedOpacity = 1.0;
        } else if (time < 2.0) {
            // 페이드 아웃 (1.5초 ~ 2.0초)
            timeBasedOpacity = 1.0 - smoothstep(1.5, 2.0, time);
        }
        
        // 최종 알파 설정
        gl_FragColor = vec4(col, timeBasedOpacity * opacity);
    }`;

  const vertexShader = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  // scale이 Vector3로 전달되면 첫 번째 값을 사용
  const scaleValue = scale instanceof Vector3 ? scale.x : 1;

  return (
    <ShaderEffect
      position={position}
      vertexShader={vertexShader}
      fragmentShader={iceFragmentShader}
      scale={scaleValue * 1.2}
      color={new Color(0.7, 0.9, 1.0)} // 얼음 색상 - 연한 파란색
      duration={2000}
      blending={AdditiveBlending}
      normal={normal}
      disableBillboard={disableBillboard}
      depthWrite={false}
      depthTest={false}
      volume={volume}
      uniforms={{
        resolution: {
          value: new Vector2(window.innerWidth, window.innerHeight),
        },
        time: { value: 0 },
        opacity: { value: 1.0 },
      }}
    />
  );
};
