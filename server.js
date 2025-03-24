class Server {
  async getMyState() {
    const myState = await $global.getMyState();
    return { myState };
  }

  async updateProfile(profile) {
    await $global.updateMyState({ profile: profile });
    const state = await $global.getMyState();
    return { state };
  }

  async getRooms() {
    const { rooms } = await $global.state;
    return rooms;
  }

  async joinRoom(roomId) {
    const result = await $global.joinRoom(roomId);
    const myState = await $global.getMyState();
    const roomState = await $room.getRoomState();
    if (!roomState.status) {
      await $room.updateRoomState({
        status: 'LOBBY',
      });
    }
    await $room.updateMyState({
      playerState: {
        profile: { username: myState.profile.username },
        stats: {
          maxHp: 100,
          attackPower: 10,
        },
      },
      characterState: {
        currentHp: 100,
        score: 0,
        weaponType: '/models/weapons/ak47.glb', // 기본 무기 타입으로 초기화
      }
    });
    const myRoomState = await $room.getMyState();

    return { result, roomState, myRoomState };
  }

  async leaveRoom() {
    const result = await $room.leave();
    return { result };
  }

  async ready(isReady = true) {
    const result = await $room.updateMyState({
      ready: isReady,
    });
    const state = await $room.getRoomState();
    if (state.status === 'LOBBY') {
      // 모든 사용자의 ready 상태 확인
      const users = state.$users;
      const allUsers = [];

      for (const account of users) {
        const userState = await $room.getUserState(account);
        allUsers.push(userState);
      }

      // 모든 사용자가 ready 상태인지 확인
      const allReady = allUsers.every((user) => user.ready);

      // 모든 사용자가 ready 상태이면 게임 상태를 PLAYING으로 변경
      if (allReady) {
        await $room.updateRoomState({
          status: 'PLAYING',
        });
      }
    }
    return result;
  }

  async updateCharacterState(updatedCharacterState) {
    const prev = await $room.getMyState();
    await $room.updateMyState({
      characterState: {
        ...prev.characterState,
        ...updatedCharacterState,
      },
    });
  }

  async takeDamage(userId, damageAmount, attackerId, position) {
    const prev = await $room.getUserState(userId);  
    
    // 살아있는 상태에서 이번 공격으로 죽는 경우만 킬 점수 부여
    const wasAlive = prev.characterState.currentHp > 0;
    const isKilled = prev.characterState.currentHp - damageAmount <= 0;
    const shouldAwardKill = wasAlive && isKilled;
    
    // 이미 죽은 대상이면 업데이트 필요 없음
    if (!wasAlive) return;
    
    const updatedUserState = {
      characterState: {
        ...prev.characterState,
        currentHp: isKilled ? 0 : prev.characterState.currentHp - damageAmount,
        lastAttackerPosition: position,
        attackerId: attackerId,
      },
    };

    await $room.updateUserState(userId, updatedUserState);

    if (shouldAwardKill) {
      const prevAttacker = await $room.getUserState(attackerId);
      const currentScore = prevAttacker.characterState?.score || 0;
      
      const updatedKillerState = {
        characterState: {
          ...prevAttacker.characterState,
          score: currentScore + 1,
        },
      };
      await $room.updateUserState(attackerId, updatedKillerState);
    }
  }

  async updateWeaponType(weaponType) {
    const prev = await $room.getMyState();
    await $room.updateMyState({
      characterState: {
        ...prev.characterState,
        weaponType: weaponType,
      },
    });
  }

  async rebirth(userId) {
    const prev = await $room.getUserState(userId);
    const maxHp = prev.playerState.stats.maxHp;
    const updatedUserState = {
      characterState: {
        ...prev.characterState,
        currentHp: maxHp,
      },
    };

    await $room.updateUserState(userId, updatedUserState);
  }

  async ping() {
    return { timestamp: Date.now() };
  }

  /* 
  async updateRoomState(updatedState) {
    return $room.updateRoomState(updatedState);
  }

  async updateMyRoomState(updatedState) {
    return $room.updateMyState(updatedState);
  }
 */
}
