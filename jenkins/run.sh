dir="/d/jenkins"
#host="https://ci.l.wozhuang.xyz"
host="http://127.0.0.1:31006"
download_url="$host/jnlpJars/agent.jar"
secret="b3996418b7fd5f48ba491ad840de3d90b36dd5a5f4c751e4ecfa18c0d4ac94eb"
cd $dir

# 下载 agent.jar
if [ ! -f agent.jar ]; then
  echo "downloading agent.jar"
  curl -O $download_url
  echo "agent.jar downloaded"
fi

# 生成 secret-file（其实命令行直接传入也行）
if [ ! -f secret-file ]; then
  echo "$secret" > secret-file
  echo "secret-file created"
fi

echo "start agent"
java -jar agent.jar -url http://127.0.0.1:31006/ -secret @secret-file -name rog -webSocket -workDir "D:\\jenkins\\"
echo "agent started"
