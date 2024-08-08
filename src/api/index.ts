import axios from 'axios'
// import qs from 'qs'
import { ElMessage } from 'element-plus'
import router from '@/router/index'
import useUserStore from '@/store/modules/user'

const toLogin = () => {
  useUserStore().logout().then(() => {
    router.push({
      path: '/login',
      query: {
        redirect: router.currentRoute.value.path !== '/login' ? router.currentRoute.value.fullPath : undefined,
      },
    })
  })
}

const api = axios.create({
  baseURL: (import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY === 'true') ? '/proxy/' : import.meta.env.VITE_APP_API_BASEURL,
  timeout: 1000 * 60,
  responseType: 'json',
})

api.interceptors.request.use(
  (request) => {
    const userStore = useUserStore()
    /**
     * 全局拦截请求发送前提交的参数
     * 以下代码为示例，在请求头里带上 token 信息
     */
    if (userStore.isLogin && request.headers) {
      request.headers.token = userStore.token
    }
    return request
  },
)

api.interceptors.response.use(
  (response) => {
    /**
     * 全局拦截请求发送后返回的数据，如果数据有报错则在这做全局的错误提示
     * 假设返回数据格式为：{ status: 1, error: '', data: '' }
     * 规则是当 status 为 1 时表示请求成功，为 0 时表示接口需要登录或者登录状态失效，需要重新登录
     * 请求出错时 error 会返回错误信息
     */
    if (response.status === 401) {
      ElMessage({
        message: '鉴权失败，请先登录',
        type: 'error',
      })
      toLogin()
    }
    else if (response.status !== 200) {
      // 这里做错误提示，如果使用了 element plus 则可以使用 Message 进行提示
      ElMessage.error({ message: '接口响应失败' })
      return Promise.reject(response.data)
    }
    else if (response.status === 200 && response.data.code === -1) {
      // 这里做错误提示，如果使用了 element plus 则可以使用 Message 进行提示
      ElMessage.error({ message: `操作异常：${response.data.message}` })
      return Promise.reject(response.data)
    }
    return Promise.resolve(response.data)
  },
  (error) => {

      type: 'error',
    })
    return Promise.reject(error)
  },
)

export default api
