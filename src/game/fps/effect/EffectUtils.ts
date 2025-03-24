import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

/**
 * 주어진 normal 벡터를 기반으로 표면 회전을 계산합니다.
 * @param position 대상 위치
 * @param normal 표면의 법선 벡터
 * @param randomZRotation 추가적인 Z축 회전 (기본값: 랜덤 회전)
 * @returns 계산된 Euler 회전
 */
export function calculateSurfaceRotation(
  position: Vector3,
  normal?: Vector3,
  randomZRotation?: Euler
): Euler {
  // randomZRotation이 제공되지 않았다면 새로 생성
  const zRotation =
    randomZRotation || new Euler(0, 0, Math.random() * Math.PI * 2);

  // normal이 없거나 길이가 0이면 기본 회전만 적용
  if (!normal || normal.lengthSq() === 0) return zRotation;

  // normal 벡터 정규화
  const normalizedNormal = normal.clone().normalize();

  // Euler 각도 계산을 위한 준비
  const euler = new Euler();

  // 정확한 look-at 계산을 위한 행렬 사용
  const lookAtMatrix = new Matrix4();
  const targetPosition = new Vector3().copy(position).add(normalizedNormal);
  const upVector = new Vector3(0, 1, 0);

  // normal이 완전히 y축과 일치하면 다른 up 벡터 사용
  if (Math.abs(normalizedNormal.y) > 0.99) {
    upVector.set(0, 0, 1);
  }

  lookAtMatrix.lookAt(position, targetPosition, upVector);
  const quaternion = new Quaternion().setFromRotationMatrix(lookAtMatrix);

  // 쿼터니언을 오일러 각도로 변환
  euler.setFromQuaternion(quaternion);

  // z축 회전 추가 (텍스처 자체 회전)
  euler.z = zRotation.z;

  return euler;
}
