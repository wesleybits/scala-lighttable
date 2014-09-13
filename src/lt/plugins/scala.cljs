(ns lt.plugins.scala
  (:require [lt.object :as object]
            [lt.objs.tabs :as tabs]
            [lt.objs.command :as cmd])
  (:require-macros [lt.macros :refer [defui behavior]]))

(defui hello-panel [this]
  [:h1 "Hello from scala"])

(object/object* ::scala.hello
                :tags [:scala.hello]
                :behaviors [::on-close-destroy]
                :name "scala"
                :init (fn [this]
                        (hello-panel this)))

(behavior ::on-close-destroy
          :triggers #{:close}
          :reaction (fn [this]
                      (when-let [ts (:lt.objs.tabs/tabset @this)]
                        (when (= (count (:objs @ts)) 1)
                          (tabs/rem-tabset ts)))
                      (object/raise this :destroy)))

(def hello (object/create ::scala.hello))

(cmd/command {:command ::say-hello
              :desc "scala: Say Hello"
              :exec (fn []
                      (tabs/add-or-focus! hello))})
