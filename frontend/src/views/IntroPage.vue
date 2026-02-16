<template>
  <div class="panel intro-panel">
    <!-- Step 1: Game Introduction -->
    <template v-if="step === 1">
      <h2>欢迎来到 Text Idle</h2>
      <div class="intro-content">
        <p>
          Text Idle 是一款文字风格的放置类 RPG 游戏。在这里，你将组建自己的冒险队伍，
          招募不同职业的角色，带领他们在冒险中不断成长。
        </p>
        <p>
          战斗会自动进行，你可以随时查看队伍状态、招募新成员、升级装备。
          轻松放置，享受冒险的乐趣！
        </p>
      </div>
      <button class="btn" @click="step = 2">下一步</button>
    </template>

    <!-- Step 2: Team Name -->
    <template v-else>
      <h2>为你的队伍起个名字</h2>
      <form @submit.prevent="confirmTeamName">
        <div class="form-group">
          <label for="teamName">队伍名称</label>
          <input
            id="teamName"
            v-model="teamName"
            type="text"
            placeholder="例如：勇者小队"
            maxlength="20"
            required
          />
          <p v-if="error" class="error-msg">{{ error }}</p>
        </div>
        <div class="intro-actions">
          <button type="button" class="btn btn-secondary" @click="step = 1">
            上一步
          </button>
          <button type="submit" class="btn">开始冒险</button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const teamName = ref('')
const error = ref('')

function confirmTeamName() {
  const name = teamName.value.trim()
  if (!name) {
    error.value = '请输入队伍名称'
    return
  }
  if (name.length < 2) {
    error.value = '队伍名称至少 2 个字符'
    return
  }
  error.value = ''
  localStorage.setItem('teamName', name)
  router.push('/main')
}
</script>

<style scoped>
.intro-panel {
  max-width: 480px;
}

.intro-content {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.intro-content p {
  margin: 0 0 1rem 0;
}

.intro-content p:last-child {
  margin-bottom: 0;
}

.intro-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.intro-actions .btn {
  flex: 1;
}

.btn-secondary {
  background: var(--bg-dark);
}
</style>
