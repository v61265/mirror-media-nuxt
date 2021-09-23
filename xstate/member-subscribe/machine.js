import { assign, createMachine as createMachineXState } from 'xstate'
import machine from './config/machine'
import options from './config/options'
import { setMemberTosToTrue } from '~/apollo/mutations/memberSubscriptionMutation.gql'

export default function createMachine(router, route, store, apolloProvider) {
  return createMachineXState(machine, {
    guards: {
      ...options.guards,
    },
    actions: {
      ...options.actions,
      setFromPost: assign({
        isFromPost: route.value.fullPath,
      }),
      orderSubscribeOneTimePostId: assign({
        subscriptionOrderOneTimePostId: (context, event) => {
          const { postId } = event
          return postId
        },
      }),
      setUserEmailVerification: assign({
        isEmailVerified: !!store.state.membership.userEmailVerified,
      }),
      navigateToLoginPage() {
        createNavigation(
          router,
          route,
          `/login?destination=${route.value.fullPath}&ms=true`
        )
      },
      navigateToServiceRule() {
        createNavigation(router, route, '/service-rule?ms=true')
      },
      navigateToPremiumPage(context) {
        createNavigation(router, route, context.isFromPost)
      },
      navigateToSubscribePlans() {
        createNavigation(router, route, '/subscribe?ms=true')
      },
      navigateToSubscribeInfo() {
        createNavigation(router, route, '/subscribe/info?ms=true')
      },
      navigateToSubscribeSuccess() {
        createNavigation(router, route, '/subscribe/success?ms=true')
      },
      navigateToSubscribeFail() {
        createNavigation(router, route, '/subscribe/fail?ms=true')
      },
      navigateToSubscribeSet() {
        createNavigation(router, route, '/subscribe/set?ms=true')
      },
      navigateToSubscribeCancelAsk() {
        createNavigation(router, route, '/subscribe/cancel-ask?ms=true')
      },
      navigateToSubscribeCancelSuccess() {
        createNavigation(router, route, '/subscribe/cancel-success?ms=true')
      },
      navigateToSubscribeCancelFail() {
        createNavigation(router, route, '/subscribe/cancel-fail?ms=true')
      },
      navigateToProfilePurchase() {
        createNavigation(router, route, '/profile/purchase?ms=true')
      },
      navigateToEmailVerify() {
        createNavigation(router, route, '/email-verify?ms=true')
      },
      navigateToSectionMember() {
        window.location.assign('/section/member')
      },

      agreeTos: assign({
        isTosAgreed: async () => {
          const {
            data,
          } = await apolloProvider.clients.memberSubscription.mutate({
            mutation: setMemberTosToTrue,
            variables: {
              id: store.state['membership-subscribe'].basicInfo.id,
            },
          })
          const tos = data?.updateMember?.tos ?? false
          store.commit('membership-subscribe/SET_BASIC_INFO', { tos })
          return tos
        },
      }),
    },
  }).withContext({
    ...machine.context,
    isLoggedIn: store.getters['membership/isLoggedIn'],
    isTosAgreed: store.state['membership-subscribe'].basicInfo?.tos ?? false,
    isEmailVerified: !!store.state.membership.userEmailVerified,
    subscription: getSubscription(
      store.state['membership-subscribe'].basicInfo.type
    ),
  })
}

function createNavigation(router, route, path) {
  if (!path || shouldStopNavigation(route, path)) {
    return
  }
  router.replace(path)

  function shouldStopNavigation(route, path) {
    return isCurrentRoutePathMatching()

    function isCurrentRoutePathMatching() {
      return route.value.fullPath.startsWith(path)
    }
  }
}

function getSubscription(memberType) {
  const mapping = {
    subscribe_yearly: '年訂閱',
    subscribe_monthly: '月訂閱',
    subscribe_one_time: '解鎖這篇報導',
    none: null,
  }
  return mapping[memberType]
}
