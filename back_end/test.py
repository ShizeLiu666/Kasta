import sys
import json

def main():
    try:
        input_data = sys.stdin.read()
        # 模拟处理逻辑
        output_data = {"status": "success", "data": input_data}
        print(json.dumps(output_data))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()